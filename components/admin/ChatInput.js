// components/admin/ChatInput.js
import MediaUpload from '../MediaUpload';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export function ChatInput({
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
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Media Preview */}
      {previewMedia && (
        <div className="mb-2">
          {previewMedia.type === 'image' && (
            <div className="relative group">
              <img
                src={previewMedia.url}
                alt="Preview"
                className="w-32 h-32 rounded-lg object-cover"
              />
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          {previewMedia.type === 'audio' && (
            <div className="space-y-2">
              <audio src={previewMedia.url} controls className="w-full" />
              <button
                onClick={() => setPreviewMedia(null)}
                className="text-sm text-red-500 hover:text-red-600"
              >
                Remove Audio
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 items-center">
        {/* Emoji Button */}
        <button
          onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
          className="text-gray-400 hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-700"
          title="Add emoji"
        >
          😀
        </button>

        {/* Media Upload Button */}
        <div className="relative">
          <MediaUpload onUpload={onMediaUpload} />
        </div>

        {/* Message Input */}
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Type your message..."
        />

        {/* Send Button */}
        <button
          onClick={onSend}
          disabled={!inputMessage.trim() && !previewMedia}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <span>Send</span>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>

      {/* Emoji Picker */}
      {isEmojiPickerOpen && (
        <div className="absolute bottom-full mb-2">
          <div className="relative">
            <div className="absolute bottom-0 right-0 bg-gray-800 rounded-lg shadow-xl">
              <Picker 
                data={data} 
                onEmojiSelect={(emoji) => {
                  onEmojiSelect(emoji);
                  setIsEmojiPickerOpen(false);
                }} 
                theme="dark"
                position="top"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatInput;