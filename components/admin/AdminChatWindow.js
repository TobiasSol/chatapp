// components/admin/AdminChatWindow.js
import { useEffect, useRef } from 'react';
import AdminMessage from './AdminMessage';

export function AdminChatWindow({ messages }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <AdminMessage key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default AdminChatWindow;