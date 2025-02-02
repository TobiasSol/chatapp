// components/admin/ChatArea.js
import { AdminChatWindow } from './AdminChatWindow'; // Ändere den Import zu named import
import ChatInput from './ChatInput';

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
    <div className="flex-1 p-4 overflow-hidden flex flex-col">
      <div className="flex-1 bg-gray-800/90 backdrop-blur-lg rounded-lg shadow-sm overflow-hidden mb-4">
        <AdminChatWindow messages={messages} />
      </div>

      <ChatInput 
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        previewMedia={previewMedia}
        setPreviewMedia={setPreviewMedia}
        isEmojiPickerOpen={isEmojiPickerOpen}
        setIsEmojiPickerOpen={setIsEmojiPickerOpen}
        onSend={onSend}
        onEmojiSelect={onEmojiSelect}
        onMediaUpload={onMediaUpload}
      />
    </div>
  );
}

export default ChatArea;