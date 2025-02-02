// pages/login.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // PWA Install Prompt abfangen
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Ihre bestehende Login-Logik
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (data) {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminUsername', username);

        // Wenn PWA noch nicht installiert, Installation anbieten
        if (deferredPrompt) {
          const result = await deferredPrompt.prompt();
          if (result.outcome === 'accepted') {
            console.log('PWA wurde installiert');
          }
          setDeferredPrompt(null);
        }

        router.push('/admin');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-gray-800/90 backdrop-blur-lg p-8 rounded-lg shadow-xl w-96">
        {/* Bestehende Login-Form */}
        
        {deferredPrompt && (
          <button
            type="button"
            onClick={async () => {
              const result = await deferredPrompt.prompt();
              if (result.outcome === 'accepted') {
                console.log('PWA wurde installiert');
              }
              setDeferredPrompt(null);
            }}
            className="mt-4 w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Als App installieren
          </button>
        )}
      </form>
    </div>
  );
}