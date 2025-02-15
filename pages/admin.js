import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Toaster, toast } from 'react-hot-toast';
import { AdminHeader } from '../components/admin/AdminHeader';
import { Sidebar } from '../components/admin/Sidebar';
import ChatArea from '../components/admin/ChatArea';
import { EmptyState } from '../components/admin/EmptyState';

export default function Admin() {
  // State Management
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [imagePrice, setImagePrice] = useState('');
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  
  const router = useRouter();

  // Auth Check
  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = localStorage.getItem('isAdmin');
      if (!isAdmin) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // Load read receipts setting when guest changes
  useEffect(() => {
    const loadReadReceiptsSetting = async () => {
      if (!selectedGuest) return;
      
      try {
        const { data, error } = await supabase
          .from('guests')
          .select('read_receipts_enabled')
          .eq('username', selectedGuest.username)
          .single();

        if (error) throw error;
        setReadReceiptsEnabled(data?.read_receipts_enabled ?? true);
      } catch (err) {
        console.error('Error loading read receipts setting:', err);
      }
    };

    loadReadReceiptsSetting();
  }, [selectedGuest]);

  // Initial Load of unread messages
  useEffect(() => {
    const loadUnreadMessages = async () => {
      try {
        const lastLoginStr = localStorage.getItem('lastAdminLogin') || new Date().toISOString();
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('sender', 'guest')
          .eq('is_read', false)
          .gte('created_at', lastLoginStr);

        if (error) throw error;

        const unread = {};
        messages?.forEach(msg => {
          if (!unread[msg.guest_name]) {
            unread[msg.guest_name] = 0;
          }
          unread[msg.guest_name]++;
        });

        setUnreadMessages(unread);
        localStorage.setItem('lastAdminLogin', new Date().toISOString());
      } catch (err) {
        console.error('Error loading unread messages:', err);
      }
    };

    loadUnreadMessages();
  }, []);

  // Guest Status Management
  useEffect(() => {
    const fetchGuests = async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('last_activity', { ascending: false });
      
      if (error) {
        console.error('Error fetching guests:', error);
        return;
      }
      
      setGuests(data);
    };
  
    fetchGuests();

    // Subscribe to guest status changes
    const guestChannel = supabase
      .channel('guest-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests'
        },
        handleGuestStatusChange
      )
      .subscribe();

    // Update online status every 30 seconds
    const statusInterval = setInterval(updateGuestsStatus, 30000);

    return () => {
      guestChannel.unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  // Message tracking
  useEffect(() => {
    const messageChannel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            handleNewMessage(payload);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            ));
          }
        }
      )
      .subscribe();

    return () => messageChannel.unsubscribe();
  }, [selectedGuest]);

  // Selected guest chat
  useEffect(() => {
    if (!selectedGuest) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('guest_name', selectedGuest.username)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
        return;
      }
      
      setMessages(data || []);

      // Mark messages as delivered
      const undeliveredMessages = data?.filter(msg => 
        msg.sender === 'guest' && !msg.is_delivered
      ) || [];

      if (undeliveredMessages.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_delivered: true })
          .in('id', undeliveredMessages.map(msg => msg.id));

        if (updateError) {
          console.error('Error marking messages as delivered:', updateError);
        }
      }
    };

    loadMessages();

    const chatChannel = supabase
      .channel(`chat-${selectedGuest.username}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `guest_name=eq.${selectedGuest.username}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new]);
            
            // Automatically mark guest messages as delivered when received
            if (payload.new.sender === 'guest') {
              markMessageAsDelivered(payload.new.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? payload.new : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => chatChannel.unsubscribe();
  }, [selectedGuest]);

  const handleGuestStatusChange = (payload) => {
    if (payload.eventType === 'INSERT') {
      const newGuest = {
        ...payload.new,
        isOnline: payload.new.last_activity ? 
          (new Date().getTime() - new Date(payload.new.last_activity).getTime() <= 2 * 60 * 1000) : 
          false
      };
      
      setGuests(prev => [newGuest, ...prev]);
      toast.success(`New guest joined: ${payload.new.username}`);
    } else if (payload.eventType === 'UPDATE') {
      setGuests(prev => prev.map(guest => 
        guest.id === payload.new.id ? {
          ...guest,
          ...payload.new,
          isOnline: payload.new.last_activity ? 
            (new Date().getTime() - new Date(payload.new.last_activity).getTime() <= 2 * 60 * 1000) : 
            false
        } : guest
      ));
    }
  };

  const handleNewMessage = (payload) => {
    if (payload.new.sender === 'guest') {
      if (!selectedGuest || selectedGuest.username !== payload.new.guest_name) {
        setUnreadMessages(prev => ({
          ...prev,
          [payload.new.guest_name]: (prev[payload.new.guest_name] || 0) + 1
        }));
      }
    }
  };

  const markMessageAsDelivered = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_delivered: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking message as delivered:', err);
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const updateGuestsStatus = () => {
    setGuests(currentGuests => 
      currentGuests.map(guest => ({
        ...guest,
        isOnline: guest.last_activity ? 
          (new Date().getTime() - new Date(guest.last_activity).getTime() <= 2 * 60 * 1000) : 
          false
      }))
    );
  };

  const handleGuestSelect = (guest) => {
    setSelectedGuest(guest);
    setIsSidebarOpen(false);
    setUnreadMessages(prev => {
      const newUnreadMessages = { ...prev };
      if (newUnreadMessages[guest.username]) {
        delete newUnreadMessages[guest.username];
      }
      return newUnreadMessages;
    });
  };

  const handleToggleReadReceipts = async () => {
    if (!selectedGuest) return;

    try {
      const { error } = await supabase
        .from('guests')
        .update({ read_receipts_enabled: !readReceiptsEnabled })
        .eq('username', selectedGuest.username);

      if (error) throw error;

      setReadReceiptsEnabled(!readReceiptsEnabled);
      toast.success(`Read receipts ${!readReceiptsEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error toggling read receipts:', err);
      toast.error('Failed to toggle read receipts');
    }
  };

  const handleSend = async (content, contentType = 'text', price = null) => {
    if (!selectedGuest) return;
    
    try {
      let messageData = {
        content_type: contentType,
        guest_name: selectedGuest.username,
        sender: 'admin',
        is_locked: price !== null,
        is_delivered: false,
        is_read: false,
        is_unsent: false
      };
  
      if (contentType === 'image') {
        if (content.files) {
          messageData.content = content.files;
          messageData.price = content.price;
        } else {
          messageData.content = content;
          messageData.price = price;
        }
      } else {
        messageData.content = content;
      }
  
      const { error } = await supabase.from('messages').insert([messageData]);
  
      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  const handleMediaUpload = (url, fileType) => {
    if (!url) {
      setPreviewMedia(null);
      return;
    }

    let type = 'file';
    if (fileType) {
      const [mainType] = fileType.split('/');
      type = mainType || 'file';
    }

    setPreviewMedia({
      url: url,
      type: type
    });
  };

  const handleEmojiSelect = (emoji) => {
    setInputMessage((prev) => prev + emoji.native);
    setIsEmojiPickerOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminUsername');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <Toaster position="top-right" />

      <div className="flex h-screen">
        <Sidebar 
          isOpen={isSidebarOpen}
          guests={guests}
          onGuestSelect={handleGuestSelect}
          selectedGuest={selectedGuest}
          unreadMessages={unreadMessages}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <AdminHeader 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogout={handleLogout}
          />

          {selectedGuest ? (
            <ChatArea 
              selectedGuest={selectedGuest}
              messages={messages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              previewMedia={previewMedia}
              setPreviewMedia={setPreviewMedia}
              isEmojiPickerOpen={isEmojiPickerOpen}
              setIsEmojiPickerOpen={setIsEmojiPickerOpen}
              onSend={handleSend}
              onEmojiSelect={handleEmojiSelect}
              onMediaUpload={handleMediaUpload}
              imagePrice={imagePrice}
              setImagePrice={setImagePrice}
              readReceiptsEnabled={readReceiptsEnabled}
              onToggleReadReceipts={handleToggleReadReceipts}
              onMarkAsRead={markMessageAsRead}
              onMarkAsDelivered={markMessageAsDelivered}
            />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}