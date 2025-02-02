// components/admin/Sidebar.js
import GuestList from './GuestList';

export function Sidebar({ 
  isOpen, 
  guests, 
  onGuestSelect, 
  selectedGuest, 
  unreadMessages, 
  onToggleRead 
}) {
  return (
    <aside
      className={`fixed md:relative w-64 sm:w-80 bg-gray-800/90 backdrop-blur-lg shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 z-20`}
    >
      <div className="p-2 sm:p-4 border-b border-gray-700">
        <h1 className="text-lg sm:text-xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Active Guests: {guests.filter(g => g.isOnline).length}
        </p>
      </div>
      <GuestList 
        guests={guests}
        onSelect={onGuestSelect}
        selected={selectedGuest}
        unreadMessages={unreadMessages}
        onToggleRead={onToggleRead}
      />
    </aside>
  );
}