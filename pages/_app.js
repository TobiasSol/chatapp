// pages/_app.js
import '../styles/globals.css'
import { useEffect } from 'react';
import { useRouter } from 'next/router';

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

  // Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(async (registration) => {
          console.log('ServiceWorker registered:', registration);

          try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
              // Convert VAPID key to Uint8Array
              const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
              const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

              const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
              });

              // Save subscription to backend
              const userId = localStorage.getItem('isAdmin') 
                ? localStorage.getItem('adminUsername')
                : localStorage.getItem('username');

              if (userId) {
                await fetch('/api/push-subscription', {
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
          } catch (err) {
            console.error('Error during push subscription:', err);
          }
        })
        .catch((err) => console.error('ServiceWorker registration failed:', err));
    }
  }, []);

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return <Component {...pageProps} />
}

export default MyApp