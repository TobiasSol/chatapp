export default function AdminMessage({ message }) {
  const isAdmin = message.sender === 'admin';
  const isImage = message.content_type === 'image';
  const isLocked = message.is_locked !== false;
  
  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderContent = () => {
    if (isImage) {
      const images = Array.isArray(message.content) 
        ? message.content 
        : [message.content];
      
      return (
        <div>
          <div className="flex flex-wrap gap-2 max-w-[600px]">
            {images.map((img, index) => (
              <div key={index} className="relative w-24 h-24">
                <img 
                  src={typeof img === 'string' ? img : img.url} 
                  className="w-24 h-24 object-cover rounded-lg"
                  alt="Chat Image"
                />
              </div>
            ))}
          </div>
          {message.price && (
            <div className="mt-2 bg-black/50 text-white text-xs p-1 rounded-lg text-center">
              {isLocked ? (
                <span>Angeboten für ${message.price}</span>
              ) : (
                <span>Gekauft für ${message.price}</span>
              )}
            </div>
          )}
        </div>
      );
    }
    return <p className="break-words whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className={`flex mb-4 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col max-w-[80%] sm:max-w-[70%]">
        {!isAdmin && (
          <span className="text-xs text-gray-300 mb-1">
            {message.guest_name}
          </span>
        )}
        
        <div className={`rounded-lg px-3 py-1 ${
          isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
        }`}>
          {renderContent()}
        </div>
        
        <div className={`text-xs mt-1 ${
          isAdmin ? 'text-gray-300 text-right' : 'text-gray-400 text-left'
        }`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
}