// pages/_app.js
import '../styles/globals.css'
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // PWA Check & Redirect
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      const isAdmin = localStorage.getItem('isAdmin');
      const currentPath = window.location.pathname;
      
      if (isAdmin && currentPath === '/') {
        router.replace('/admin');
      }
    }
  }, [router]);

  return <Component {...pageProps} />
}

export default MyApp;