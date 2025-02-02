import { AdminChatWindow } from './AdminChatWindow';
import MediaUpload from '../MediaUpload';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export function ChatArea({ 
  selectedGuest,
  messages,
  inputMessage,
  setInputMessage,
  previewMedia,
  setPreviewMedia,
  isEmojiPickerOpen,
  setIsEmojiPickerOpen,
  onSend,
  onEmojiSelect,
  onMediaUpload
}) {
  return (
    <div className="flex-1 p-2 overflow-hidden flex flex-col">
      <div className="flex-1 bg-gray-800/90 backdrop-blur-lg rounded-lg shadow-sm overflow-hidden mb-4">
        <AdminChatWindow messages={messages} />
      </div>

      <div className="bg-gray-800/90 backdrop-blur-lg rounded-lg p-2">
        {/* Media Preview */}
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
                  onClick={() => setPreviewMedia(null)}
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

        {/* Actions Row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-full transition-colors"
          >
            😀
          </button>
          <MediaUpload onUpload={onMediaUpload} />
        </div>

        {/* Input Row */}
        <div className="flex gap-2">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            onClick={onSend}
            disabled={!inputMessage.trim() && !previewMedia}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {/* Emoji Picker */}
        {isEmojiPickerOpen && (
          <div className="absolute bottom-full right-0 mb-2">
            <div className="bg-gray-800 rounded-lg shadow-xl">
              <Picker
                data={data}
                onEmojiSelect={onEmojiSelect}
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