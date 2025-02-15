import { useEffect, useRef } from 'react';
import Message from '../Message';

export function AdminChatWindow({ messages, readReceiptsEnabled }) {
  const bottomRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div 
      ref={containerRef}
      className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 px-4 py-2"
    >
      <div className="max-w-3xl mx-auto">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            isAdmin={true}
            readReceiptsEnabled={readReceiptsEnabled}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}