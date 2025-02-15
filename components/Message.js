// components/Message.js
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Message = ({ message, currentUser, isAdmin = false, onUnsend, readReceiptsEnabled = true }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();
  const isOwnMessage = isAdmin ? message.sender === 'admin' : message.sender === 'guest';
  const isImage = message.content_type === 'image';
  
  const formattedTime = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUnsend = async () => {
    if (!isOwnMessage) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_unsent: true })
        .eq('id', message.id);

      if (error) throw error;
      
      setShowMenu(false);
      if (onUnsend) onUnsend(message.id);
    } catch (err) {
      console.error('Error unsending message:', err);
    }
  };

  // Wenn es eine unsent Nachricht ist und wir im Chat sind (nicht Admin), 
  // dann zeigen wir sie nicht an
  if (message.is_unsent && !isAdmin) {
    return null;
  }

  const renderReadReceipts = () => {
    if (!readReceiptsEnabled || !isOwnMessage) return null;

    if (message.is_read) {
      return (
        <span className="text-xs text-gray-400 ml-1">
          ✓✓  {/* Doppelhaken für gelesen */}
        </span>
      );
    } else if (message.is_delivered) {
      return (
        <span className="text-xs text-gray-400 ml-1">
          ✓  {/* Einzelner Haken für zugestellt */}
        </span>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (isImage) {
      // Wenn content ein Array ist
      if (Array.isArray(message.content)) {
        return (
          <div className="flex flex-wrap gap-2 max-w-[600px]">
            {message.content.map((url, index) => (
              <div key={index} className="relative w-24 h-24">
                <img 
                  src={url}
                  className="w-24 h-24 object-cover rounded-lg"
                  alt={`Image ${index + 1}`}
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="w-24 h-24 flex items-center justify-center bg-gray-700 rounded-lg text-white text-xs">
                        Bild nicht verfügbar
                      </div>
                    `;
                  }}
                />
              </div>
            ))}
          </div>
        );
      }

      // Wenn content ein einzelnes Bild ist
      return (
        <div className="relative">
          <img 
            src={message.content}
            className="max-w-[300px] rounded-lg"
            alt="Chat Image"
            onError={(e) => {
              console.error('Image load error:', e);
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div class="w-full h-48 flex items-center justify-center bg-gray-700 rounded-lg text-white">
                  Bild nicht verfügbar
                </div>
              `;
            }}
          />
          {message.price && (
            <div className="mt-2 bg-black/50 text-white text-xs p-1 rounded-lg text-center">
              {message.is_locked ? (
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

  const messageStyles = isAdmin
    ? 'bg-blue-500 text-white'
    : 'bg-gray-100 text-gray-900';

  return (
    <div className={`flex mb-4 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[70%] relative ${
        isAdmin ? 'items-end' : 'items-start'
      }`}>
        {/* Message Content */}
        <div className={`rounded-lg px-3 py-2 ${
          message.is_unsent ? 'bg-red-100 text-red-800' : messageStyles
        }`}>
          {message.is_unsent ? (
            <p className="italic">Diese Nachricht wurde zurückgezogen</p>
          ) : (
            renderContent()
          )}
        </div>

        {/* Time and Read Receipts */}
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          {formattedTime}
          {renderReadReceipts()}
        </div>

        {/* Three Dots Menu - Always visible for own messages */}
        {isOwnMessage && !message.is_unsent && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute ${isAdmin ? '-left-6' : '-right-6'} top-0 p-1 text-gray-400`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        )}

        {/* Menu Dropdown */}
        {showMenu && (
          <div 
            ref={menuRef} 
            className={`absolute top-0 mt-6 bg-white rounded-lg shadow-lg py-1 z-10 ${
              isAdmin ? 'left-0' : 'right-0'
            }`}
          >
            <button
              onClick={handleUnsend}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left whitespace-nowrap"
            >
              Nachricht zurückziehen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;