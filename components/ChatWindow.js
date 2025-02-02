// components/ChatWindow.js
import { useEffect, useRef } from 'react'
import Message from './Message'

// components/ChatWindow.js
export default function ChatWindow({ messages, currentUser, lockedImages, onUnlockImage }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[600px] overflow-y-auto p-4 border rounded">
      {messages.map((msg) => (
        <Message
          key={msg.id}
          message={msg}
          lockedImages={lockedImages}
          onUnlockImage={onUnlockImage} // onUnlockImage wird weitergeleitet
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}