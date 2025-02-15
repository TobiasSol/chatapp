import { useEffect, useRef } from 'react';
import Message from './Message';

export default function ChatWindow({ messages, currentUser, readReceiptsEnabled, onUnsend }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg) => (
        <Message
          key={msg.id}
          message={msg}
          currentUser={currentUser}
          readReceiptsEnabled={readReceiptsEnabled}
          onUnsend={onUnsend}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}