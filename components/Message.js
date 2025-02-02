import React from 'react';

const Message = ({ message, lockedImages = {}, onUnlockImage }) => {
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
        <div className="relative w-full">
          {isLocked ? (
            <div className="bg-black/50 rounded-lg p-4 flex items-center justify-center">
              <button
                onClick={() => onUnlockImage(message.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Unlock
              </button>
            </div>
          ) : (
            <img 
              src={message.content} 
              className="max-w-full h-auto rounded-lg" 
              alt="Chat Image" 
            />
          )}
        </div>
      );
    }
    return <p className="break-words whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className={`flex mb-4 ${!isAdmin ? 'justify-end' : 'justify-start'} `}>
      <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
        {isAdmin && (
          <span className="text-xs text-gray-300 mb-1">
            ❤️Lia❤️
          </span>
        )}
        
        <div className={`rounded-lg px-3 py-1 ${
          !isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          {renderContent()}
        </div>
        
        <div className={`text-xs mt-1 ${
          !isAdmin ? 'text-gray-300 text-right' : 'text-gray-400 text-left'
        }`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default Message;