import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      } else {
        alert('Ungültige Anmeldedaten');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login fehlgeschlagen');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-gray-800/90 backdrop-blur-lg p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Login</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Login
          </button>
        </div>

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