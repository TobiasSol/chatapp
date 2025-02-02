// components/Message.js
export default function Message({ message, lockedImages = {}, onUnlockImage }) {
  const isAdmin = message.sender === 'admin';
  const isImage = message.content_type === 'image';
  const isLocked = isImage && !lockedImages[message.id];

  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderContent = () => {
    if (isImage) {
      return (
        <div className="relative">
          {isLocked ? (
            <div className="bg-black/50 rounded-lg p-4 flex items-center justify-center">
              <button
                onClick={() => onUnlockImage(message.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Entlock
              </button>
            </div>
          ) : (
            <img src={message.content} className="max-w-xs rounded" alt="Chat Image" />
          )}
        </div>
      );
    }
    return <p>{message.content}</p>;
  };

  return (
    <div className={`flex mb-4 ${!isAdmin ? 'justify-end' : ''}`}>
      <div
        className={`max-w-[70%] ${
          !isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-100'
        } p-3 rounded-lg`}
      >
        {!isAdmin && (
          <div className="text-sm text-gray-500 mb-1">{message.guest_name}</div>
        )}

        {renderContent()}

        <div className="text-xs text-gray-400 mt-1 text-right">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}