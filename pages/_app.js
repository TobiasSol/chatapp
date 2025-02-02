// pages/_app.js
import '../styles/globals.css'
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Prüfen ob die App als PWA läuft
    if (window.matchMedia('(display-mode: standalone)').matches) {
      const isAdmin = localStorage.getItem('isAdmin');
      const currentPath = window.location.pathname;
      
      // Wenn Admin und auf Startseite, zu /admin weiterleiten
      if (isAdmin && currentPath === '/') {
        router.replace('/admin');
      }
    }
  }, []);

  return <Component {...pageProps} />
}

export default MyApp