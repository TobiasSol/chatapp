// components/admin/EmptyState.js
export function EmptyState() {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center p-8 max-w-md">
          {/* Chat Icon */}
          <div className="mb-6">
            <svg
              className="w-16 h-16 mx-auto text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
  
          {/* Title */}
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            No Chat Selected
          </h2>
  
          {/* Description */}
          <p className="text-gray-400 mb-6">
            Select a guest from the sidebar to start chatting. You'll see their messages and conversation history here.
          </p>
  
          {/* Tips */}
          <div className="text-sm text-gray-500 space-y-2">
            <p>💡 Tips:</p>
            <ul className="list-disc text-left pl-4 space-y-1">
              <li>Green dots indicate online guests</li>
              <li>Unread messages show as notifications</li>
              <li>Click a guest's name to load their chat</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
  
  export default EmptyState;