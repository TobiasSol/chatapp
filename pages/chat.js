import { useEffect, useState } from 'react';
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
  const router = useRouter();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
      router.push('/');
      return;
    }
    setUsername(storedUsername);

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`guest_name.eq.${storedUsername},and(sender.eq.admin,guest_name.eq.${storedUsername})`)
          .order('created_at', { ascending: true });
      
        if (error) {
          console.error('Error loading messages:', error);
          toast.error('Failed to load messages');
          return;
        }
      
        setMessages(data || []);
      } catch (err) {
        console.error('Error loading messages:', err);
        toast.error('Failed to load messages');
      }
    };

    loadMessages();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `guest_name=eq.${storedUsername}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Update activity status
    const updateActivity = async () => {
      try {
        const { error } = await supabase
          .from('guests')
          .update({ 
            last_activity: new Date().toISOString() 
          })
          .eq('username', storedUsername);

        if (error) {
          console.error('Error updating activity:', error);
        }
      } catch (err) {
        console.error('Error updating activity:', err);
      }
    };

    const interval = setInterval(updateActivity, 30000);
    updateActivity();

    // Setup notifications
    if ('Notification' in window) {
      const notificationChannel = supabase
        .channel('message-notifications')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `guest_name=eq.${storedUsername}` 
          },
          async (payload) => {
            if (document.hidden && Notification.permission === 'granted') {
              new Notification('New Message', {
                body: `New message from ${payload.new.sender}`,
                icon: '/icon.png'
              });
            }
          }
        )
        .subscribe();

      return () => {
        messagesChannel.unsubscribe();
        notificationChannel.unsubscribe();
        clearInterval(interval);
      };
    }

    return () => {
      messagesChannel.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  const handleSend = async () => {
    if (!username) return;

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
          guest_name: username,
          sender: 'guest',
        },
      ]);

      if (error) throw error;
      setInputMessage('');
      setPreviewMedia(null);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
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
    localStorage.removeItem('username');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <Toaster />

      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <header className="px-4 py-3 bg-gray-800/90 backdrop-blur-lg">
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

        <main className="flex-1 overflow-hidden p-4">
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-lg h-full flex flex-col">
            <ChatWindow messages={messages} currentUser={username} />

            <div className="p-3 border-t border-gray-700">
              {previewMedia && (
                <div className="mb-2">
                  {previewMedia.type === 'image' && (
                    <img
                      src={previewMedia.url}
                      alt="Preview"
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                  )}
                  {previewMedia.type === 'audio' && (
                    <audio src={previewMedia.url} controls className="w-full" />
                  )}
                  <button
                    onClick={() => setPreviewMedia(null)}
                    className="mt-2 text-sm text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  😀
                </button>
                <MediaUpload onUpload={handleMediaUpload} />
                <input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                />
                <button
                  onClick={handleSend}
                  disabled={!inputMessage.trim() && !previewMedia}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>

              {isEmojiPickerOpen && (
                <div className="mt-2">
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} position="top" />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}