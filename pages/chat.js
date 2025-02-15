import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import ChatWindow from '../components/ChatWindow';
import { useRouter } from 'next/router';
import { Toaster, toast } from 'react-hot-toast';
import MediaUpload from '../components/MediaUpload';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const emojiPickerRef = useRef(null);

  // Click outside emoji picker handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main chat initialization
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/');
      return;
    }
    setUsername(storedUsername);

    const loadMessages = async () => {
      try {
        // Load messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`guest_name.eq.${storedUsername},and(sender.eq.admin,guest_name.eq.${storedUsername})`)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        
        // Filter out unsent messages for the chat view
        const filteredMessages = messagesData?.filter(msg => !msg.is_unsent || msg.sender === 'admin') || [];
        setMessages(filteredMessages);

        // Mark received messages as delivered
        const undeliveredMessages = messagesData?.filter(msg => 
          msg.sender === 'admin' && !msg.is_delivered
        ) || [];

        if (undeliveredMessages.length > 0) {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ is_delivered: true })
            .in('id', undeliveredMessages.map(msg => msg.id));

          if (updateError) throw updateError;
        }

        // Load read receipts setting
        const { data: userData, error: userError } = await supabase
          .from('guests')
          .select('read_receipts_enabled')
          .eq('username', storedUsername)
          .single();

        if (userError) throw userError;
        setReadReceiptsEnabled(userData?.read_receipts_enabled ?? true);

      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load messages');
      }
    };

    loadMessages();

    // Subscribe to message changes
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `guest_name=eq.${storedUsername}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Only add non-unsent messages or admin messages
            if (!payload.new.is_unsent || payload.new.sender === 'admin') {
              setMessages(prev => [...prev, payload.new]);
              // Mark new admin messages as delivered
              if (payload.new.sender === 'admin') {
                markMessageAsDelivered(payload.new.id);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => {
                if (msg.id === payload.new.id) {
                  // If message was unsent and it's not from admin, remove it
                  if (payload.new.is_unsent && payload.new.sender !== 'admin') {
                    return null;
                  }
                  return payload.new;
                }
                return msg;
              }).filter(Boolean) // Remove null values
            );
          }
        }
      )
      .subscribe();

    // Update activity status
    const updateActivity = async () => {
      try {
        const { error } = await supabase
          .from('guests')
          .update({ 
            last_activity: new Date().toISOString(),
            status: 'online'
          })
          .eq('username', storedUsername);

        if (error) throw error;
      } catch (err) {
        console.error('Error updating activity:', err);
      }
    };

    const activityInterval = setInterval(updateActivity, 30000);
    updateActivity();

    return () => {
      messagesChannel.unsubscribe();
      clearInterval(activityInterval);
    };
  }, [router]);

  // Mark messages as read when they're viewed
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!username) return;

      try {
        const unreadMessages = messages.filter(msg => 
          msg.sender === 'admin' && !msg.is_read
        );

        if (unreadMessages.length > 0) {
          const { error } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id));

          if (error) throw error;
          
          // Update local messages state to reflect read status
          setMessages(prev => prev.map(msg => 
            unreadMessages.some(unread => unread.id === msg.id)
              ? { ...msg, is_read: true }
              : msg
          ));
        }
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };

    if (document.visibilityState === 'visible') {
      markMessagesAsRead();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        markMessagesAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [username, messages]);

  const markMessageAsDelivered = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_delivered: true })
        .eq('id', messageId);

      if (error) throw error;
      
      // Update local messages state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_delivered: true } : msg
      ));
    } catch (err) {
      console.error('Error marking message as delivered:', err);
    }
  };

  const handleSend = async () => {
    if (!username) return;

    try {
      let content = inputMessage.trim();
      let contentType = 'text';

      // Bildverarbeitung
      if (previewMedia && previewMedia.file) {
        console.log('Uploading image...', previewMedia.file);
        const fileExt = previewMedia.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${username}/${fileName}`;

        // Upload des Bildes zu Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, previewMedia.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload image');
          return;
        }

        console.log('Image uploaded successfully', uploadData);

        // Generiere die öffentliche URL
        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath);

        console.log('Generated public URL:', publicUrl);

        content = publicUrl;
        contentType = 'image';
      }

      // Überprüfe ob es Inhalt zum Senden gibt
      if (!content && contentType === 'text') return;

      console.log('Sending message with content:', { content, contentType });

      // Erstelle die Nachricht
      const messageData = {
        content,
        content_type: contentType,
        guest_name: username,
        sender: 'guest',
        is_delivered: false,
        is_read: false,
        is_unsent: false
      };

      // Sende die Nachricht an Supabase
      const { data: messageResponse, error: messageError } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (messageError) {
        console.error('Message error:', messageError);
        throw messageError;
      }

      console.log('Message sent successfully:', messageResponse);

      // Cleanup nach erfolgreichem Senden
      if (previewMedia?.url) {
        URL.revokeObjectURL(previewMedia.url);
      }
      
      setInputMessage('');
      setPreviewMedia(null);
      
      // Erfolgsmeldung
      if (contentType === 'image') {
        toast.success('Image sent successfully');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleUnsend = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_unsent: true })
        .eq('id', messageId)
        .eq('sender', 'guest'); // Only allow unsending own messages

      if (error) throw error;
      
      // Remove the message from the local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message unsent');
    } catch (err) {
      console.error('Error unsending message:', err);
      toast.error('Failed to unsend message');
    }
  };

  const handleMediaUpload = (uploads) => {
    if (!uploads || uploads.length === 0) {
      setPreviewMedia(null);
      return;
    }

    const firstUpload = uploads[0];
    
    setPreviewMedia({
      file: firstUpload.originalFile,
      url: firstUpload.previewUrl,
      type: firstUpload.type ? firstUpload.type.split('/')[0] : 'file'
    });
  };

  const handleEmojiSelect = (emoji) => {
    setInputMessage((prev) => prev + emoji.native);
    setIsEmojiPickerOpen(false);
  };

  const handleLogout = async () => {
    const currentUsername = localStorage.getItem('username');
    
    if (currentUsername) {
      try {
        const { error } = await supabase
          .from('guests')
          .update({ 
            last_activity: null,
            status: 'offline'
          })
          .eq('username', currentUsername);
  
        if (error) {
          console.error('Error updating guest status:', error);
          toast.error('Error updating status');
        }
      } catch (err) {
        console.error('Error during logout:', err);
      }
    }
  
    localStorage.removeItem('username');
    router.push('/');
  };

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const currentUsername = localStorage.getItem('username');
      if (currentUsername) {
        try {
          await supabase
            .from('guests')
            .update({ 
              last_activity: null,
              status: 'offline'
            })
            .eq('username', currentUsername);
        } catch (err) {
          console.error('Error updating status on page unload:', err);
        }
      }
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return (
    <div className="min-h-screen h-[100dvh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col overscroll-none">
      <Toaster />

      <div className="w-full h-full max-w-4xl mx-auto flex flex-col">
        <header className="flex-none px-4 py-3 bg-gray-800/90 backdrop-blur-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-white font-medium">Chat</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">{username}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-white/80 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-1 flex flex-col min-h-0">
          <div className="flex-1 bg-gray-800/90 backdrop-blur-lg rounded-lg flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden">
              <ChatWindow 
                messages={messages} 
                currentUser={username}
                onUnsend={handleUnsend}
                readReceiptsEnabled={readReceiptsEnabled}
                className="h-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
              />
            </div>

            <div className="flex-none p-2 border-t border-gray-700">
              {previewMedia && (
                <div className="mb-2">
                  {previewMedia.type === 'image' && (
                    <div className="relative inline-block">
                      <img
                        src={previewMedia.url}
                        alt="Preview"
                        className="h-24 w-auto rounded-lg object-cover"
                      />
                      <button
                        onClick={() => {
                          if (previewMedia.url) {
                            URL.revokeObjectURL(previewMedia.url);
                          }
                          setPreviewMedia(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {previewMedia.type === 'audio' && (
                    <audio src={previewMedia.url} controls className="w-full" />
                  )}
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    😀
                  </button>
                  <MediaUpload onUpload={handleMediaUpload} />
                </div>

                <div className="flex gap-2">
                  <input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a message..."
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputMessage.trim() && (!previewMedia || !previewMedia.file)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span>Send</span>
                  </button>
                </div>

                {isEmojiPickerOpen && (
                  <div 
                    ref={emojiPickerRef}
                    className="absolute bottom-full right-0 mb-2 z-50"
                  >
                    <div className="bg-gray-800 rounded-lg shadow-xl">
                      <Picker
                        data={data}
                        onEmojiSelect={handleEmojiSelect}
                        theme="dark"
                        previewPosition="none"
                        skinTonePosition="none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
            