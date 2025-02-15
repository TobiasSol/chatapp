// components/admin/GuestList.js
import { formatDistance } from 'date-fns';

export default function GuestList({ guests, onSelect, selected, unreadMessages }) {
  const sortedGuests = [...guests].sort((a, b) => {
    // First sort by unread messages
    const aUnread = unreadMessages[a.username] || 0;
    const bUnread = unreadMessages[b.username] || 0;
    if (bUnread !== aUnread) return bUnread - aUnread;
    
    // Then by online status
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    
    // Finally by last activity
    return new Date(b.last_activity || 0) - new Date(a.last_activity || 0);
  });

  return (
    <div className="overflow-y-auto">
      {sortedGuests.map(guest => {
        const unreadCount = unreadMessages[guest.username] || 0;
        const lastActive = guest.last_activity 
          ? formatDistance(new Date(guest.last_activity), new Date(), { addSuffix: true })
          : 'Never';

        return (
          <div
            key={guest.id}
            onClick={() => onSelect(guest)}
            className={`p-4 cursor-pointer border-b border-gray-700 transition-colors ${
              selected?.id === guest.id 
                ? 'bg-blue-500/20 border-l-4 border-l-blue-500' 
                : 'hover:bg-gray-700/50 border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  guest.isOnline ? 'bg-green-500' : 'bg-gray-500'
                }`}></div>
                <div>
                  <div className="font-medium text-white flex items-center gap-2">
                    {guest.username}
                    {unreadCount > 0 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full bg-green-500 text-white animate-pulse`}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {guest.isOnline ? 'Online' : `Last seen ${lastActive}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}