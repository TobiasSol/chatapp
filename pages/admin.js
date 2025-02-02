// pages/admin.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Toaster, toast } from 'react-hot-toast';

// Importiere die ausgelagerten Komponenten
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

  // Initial Load von ungelesenen Nachrichten
  useEffect(() => {
    const loadUnreadMessages = async () => {
      try {
        const lastLoginStr = localStorage.getItem('lastAdminLogin') || new Date().toISOString();
        const { data: messages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('sender', 'guest')
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
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        handleNewMessage
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
    };

    loadMessages();

    const chatChannel = supabase
      .channel(`chat-${selectedGuest.username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `guest_name=eq.${selectedGuest.username}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => chatChannel.unsubscribe();
  }, [selectedGuest]);

  // Event Handlers
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

  const handleToggleRead = (guestName) => {
    setUnreadMessages(prev => {
      const newUnreadMessages = { ...prev };
      if (newUnreadMessages[guestName]) {
        delete newUnreadMessages[guestName];
        toast.success(`Marked ${guestName}'s messages as read`);
      } else {
        newUnreadMessages[guestName] = 1;
        toast.success(`Marked ${guestName}'s messages as unread`);
      }
      return newUnreadMessages;
    });
  };

  const handleSend = async () => {
    if (!selectedGuest) return;

    let content = inputMessage.trim();
    let contentType = 'text';

    if (previewMedia) {
      content = previewMedia.url;
      contentType = previewMedia.type;
    }

    if (!content) return;

    try {
      const { error } = await supabase.from('messages').insert([
        {
          content,
          content_type: contentType,
          guest_name: selectedGuest.username,
          sender: 'admin',
        },
      ]);

      if (error) throw error;

      setInputMessage('');
      setPreviewMedia(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleMediaUpload = (url, fileType) => {
    if (!url) {
      setPreviewMedia(null);
      return;
    }
    setPreviewMedia({ url, type: fileType.split('/')[0] });
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
          onToggleRead={handleToggleRead}
        />

        <main className="flex-1 flex flex-col">
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
            />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}