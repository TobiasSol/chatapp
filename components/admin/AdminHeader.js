export function AdminHeader({ onToggleSidebar, onLogout }) {
  return (
    <header className="px-2 py-2 bg-gray-800/90 backdrop-blur-lg flex justify-between items-center border-b border-gray-700">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-white focus:outline-none p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-white ml-2">Admin Dashboard</h1>
      </div>
      <button
        onClick={onLogout}
        className="px-4 py-2 text-sm sm:text-base text-white/80 hover:text-white transition-colors hover:bg-gray-700 rounded-lg"
      >
        Logout
      </button>
    </header>
  );
}
