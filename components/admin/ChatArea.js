import React, { useState, useEffect, useCallback } from 'react';
import { AdminChatWindow } from './AdminChatWindow';
import MediaUpload from '../MediaUpload';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export function ChatArea({
  selectedGuest,
  messages,
  inputMessage,
  setInputMessage,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  onSend,
  onEmojiSelect
}) {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [imagePrice, setImagePrice] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);

  // Clean up URLs when component unmounts
  useEffect(() => {
    return () => {
      mediaFiles.forEach(media => {
        if (media.previewUrl) {
          URL.revokeObjectURL(media.previewUrl);
        }
      });
    };
  }, [mediaFiles]);

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

  const uploadToSupabase = async (file) => {
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file object');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `${selectedGuest.username}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleMediaUpload = useCallback(async (files) => {
    try {
      const processedFiles = await Promise.all(files.map(async (file) => {
        if (!file.originalFile || !(file.originalFile instanceof File)) {
          throw new Error('Invalid file object received');
        }

        return {
          file: file.originalFile,
          type: file.type || file.originalFile.type,
          previewUrl: URL.createObjectURL(file.originalFile),
          name: file.name || file.originalFile.name
        };
      }));

      setMediaFiles(prevFiles => [...prevFiles, ...processedFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Error processing files');
    }
  }, []);

  const removeMedia = (index) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index]?.previewUrl) {
        URL.revokeObjectURL(newFiles[index].previewUrl);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });

    if (mediaFiles.length === 1) {
      setImagePrice('');
    }
  };

  const handleSendWithMedia = async () => {
    if (!selectedGuest) return;
    
    try {
      setIsUploading(true);

      // Send text message if there's any
      if (inputMessage.trim()) {
        await onSend(inputMessage.trim(), 'text');
      }

      // Handle media files
      if (mediaFiles.length > 0) {
        try {
          const uploadPromises = mediaFiles
            .filter(media => media.file instanceof File)
            .map(media => uploadToSupabase(media.file));
          
          const uploadedUrls = await Promise.all(uploadPromises);

          // Nachricht mit korrektem Format senden
          const messageData = {
            content: uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls,
            content_type: 'image',
            guest_name: selectedGuest.username,
            sender: 'admin',
            is_delivered: false,
            is_read: false,
            is_unsent: false,
            price: imagePrice ? parseFloat(imagePrice) : null,
            is_locked: !!imagePrice
          };

          await onSend(messageData.content, 'image', messageData.price);

          // Clean up preview URLs
          mediaFiles.forEach(media => {
            if (media.previewUrl) {
              URL.revokeObjectURL(media.previewUrl);
            }
          });
        } catch (error) {
          console.error('Error uploading files:', error);
          toast.error('Error uploading files');
          return;
        }
      }

      // Clear states
      setInputMessage('');
      setMediaFiles([]);
      setImagePrice('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setIsUploading(false);
    }
  };

  // Mark messages as read when admin views them
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!selectedGuest) return;
      
      try {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('guest_name', selectedGuest.username)
          .eq('sender', 'guest')
          .eq('is_read', false);

        if (error) throw error;
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
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedGuest, messages]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] relative">
      <div className="bg-gray-800/90 backdrop-blur-lg p-4 flex justify-between items-center">
        <div className="text-white font-medium">{selectedGuest.username}</div>
        <button
          onClick={handleToggleReadReceipts}
          className={`px-3 py-1 rounded-full text-sm ${
            readReceiptsEnabled 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-600 text-gray-300'
          }`}
        >
          {readReceiptsEnabled ? 'Read Receipts On' : 'Read Receipts Off'}
        </button>
      </div>

      <div className="flex-1 bg-gray-800/90 backdrop-blur-lg rounded-lg shadow-sm overflow-hidden">
        <AdminChatWindow 
          messages={messages} 
          readReceiptsEnabled={readReceiptsEnabled}
          isAdmin={true}
        />
      </div>

      <div className="mt-2 bg-gray-800/90 backdrop-blur-lg rounded-lg p-2">
        {/* Media Previews */}
        {mediaFiles.length > 0 && (
          <div className="mb-3">
            {/* Single Price Input for all images */}
            {mediaFiles.some(media => media.type?.includes('image')) && (
              <div className="mb-2">
                <input
                  type="number"
                  value={imagePrice}
                  onChange={(e) => setImagePrice(e.target.value)}
                  placeholder="Price to unlock all images"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-1 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {mediaFiles.map((media, index) => (
                <div key={index} className="relative">
                  {media.type?.includes('image') && (
                    <div className="inline-block">
                      <img
                        src={media.previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="h-24 w-auto rounded-lg object-cover"
                      />
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                  {media.type?.includes('audio') && (
                    <div className="relative">
                      <audio src={media.previewUrl} controls className="w-48" />
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-full transition-colors"
            title="Add emoji"
          >
            😀
          </button>
          <MediaUpload onUpload={handleMediaUpload} />
        </div>

        {/* Input Row */}
        <div className="flex gap-2 mb-2">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendWithMedia();
              }
            }}
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSendWithMedia}
            disabled={(!inputMessage.trim() && mediaFiles.length === 0) || isUploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* Emoji Picker */}
        {isEmojiPickerOpen && (
          <div className="absolute bottom-full right-0 mb-2 z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl">
              <Picker
                data={data}
                onEmojiSelect={(emoji) => {
                  onEmojiSelect(emoji);
                  setIsEmojiPickerOpen(false);
                }}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatArea;