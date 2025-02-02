import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import GuestList from '../components/GuestList';
import ChatWindow from '../components/ChatWindow';
import { Toaster, toast } from 'react-hot-toast';
import MediaUpload from '../components/MediaUpload';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function Admin() {
  const router = useRouter();
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isAdmin = localStorage.getItem('isAdmin');
      if (!isAdmin) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    fetchGuests();

    const guestChannel = supabase
      .channel('guest-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success(`New guest joined: ${payload.new.username}`);
            fetchGuests();
          }
        }
      )
      .subscribe();

    return () => {
      guestChannel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedGuest) return;

    const messageChannel = supabase
      .channel('admin-messages')
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

    return () => {
      messageChannel.unsubscribe();
    };
  }, [selectedGuest]);

  const fetchGuests = async () => {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });
    setGuests(data || []);
  };

  const handleGuestSelect = async (guest) => {
    setSelectedGuest(guest);
    setIsSidebarOpen(false);
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('guest_name', guest.username)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
      return;
    }
    
    setMessages(data || []);
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
        <aside
          className={`fixed md:relative w-80 bg-gray-800/90 backdrop-blur-lg shadow-lg transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 z-20`}
        >
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Active Guests: {guests.length}</p>
          </div>
          <GuestList guests={guests} onSelect={handleGuestSelect} selected={selectedGuest} />
        </aside>

        <main className="flex-1 flex flex-col">
          <header className="px-4 py-3 bg-gray-800/90 backdrop-blur-lg flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden text-white focus:outline-none"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-white ml-2">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
            >
              Logout
            </button>
          </header>

          {selectedGuest ? (
            <>
              <div className="bg-gray-800/90 backdrop-blur-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <h2 className="text-lg font-medium text-white">{selectedGuest.username}</h2>
                  <span className="text-sm text-gray-400">
                    Joined {new Date(selectedGuest.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <div className="flex-1 bg-gray-800/90 backdrop-blur-lg rounded-lg shadow-sm overflow-hidden mb-4">
                  <ChatWindow messages={messages} currentUser="admin" />
                </div>

                <div className="flex flex-col gap-3">
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
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSend();
                      }}
                      className="flex-1 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type your message..."
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputMessage.trim() && !previewMedia}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mb-4 mx-auto text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="font-medium">Select a guest to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}