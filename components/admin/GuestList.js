export default function GuestList({ guests, onSelect, selected }) {
  return (
    <div className="overflow-y-auto">
      {guests.map(guest => (
        <div
          key={guest.id}
          onClick={() => onSelect(guest)}
          className={`p-4 cursor-pointer border-b transition-colors ${
            selected?.id === guest.id 
              ? 'bg-blue-500 border-l-4 border-l-blue-500' 
              : 'hover:bg-gray-500 border-l-4 border-l-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              guest.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <div>
              <div className="font-medium text-white">{guest.username}</div>
              <div className="text-sm text-gray-500">{guest.status}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}