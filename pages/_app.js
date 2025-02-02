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

  // Web Push Notifications Setup
  useEffect(() => {
    async function setupNotifications() {
      if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
        try {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            });

            const userId = localStorage.getItem('isAdmin')
              ? localStorage.getItem('adminUsername')
              : localStorage.getItem('username');

            if (userId) {
              await fetch('/api/save-subscription', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  subscription: subscription,
                  userId: userId,
                  userType: localStorage.getItem('isAdmin') ? 'admin' : 'user'
                }),
              });
            }
          }
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
    }

    setupNotifications();
  }, []);

  return <Component {...pageProps} />
}

export default MyApp;