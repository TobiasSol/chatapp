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

  // Expo Notifications Setup
  useEffect(() => {
    async function setupNotifications() {
      if (typeof window !== 'undefined') {
        try {
          // Dynamischer Import von Expo-Modulen
          const [
            { default: Constants },
            { default: Device },
            { default: Notifications }
          ] = await Promise.all([
            import('expo-constants'),
            import('expo-device'),
            import('expo-notifications')
          ]);

          if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            
            if (finalStatus !== 'granted') {
              console.log('Failed to get push token for push notification!');
              return;
            }

            try {
              const token = (await Notifications.getExpoPushTokenAsync({
                projectId: process.env.NEXT_PUBLIC_EXPO_PROJECT_ID
              })).data;

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
                    subscription: token,
                    userId: userId,
                    userType: localStorage.getItem('isAdmin') ? 'admin' : 'user'
                  }),
                });
              }

              const notificationListener = Notifications.addNotificationReceivedListener(notification => {
                console.log('Notification received:', notification);
              });

              const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
                console.log('Notification response:', response);
              });

              return () => {
                Notifications.removeNotificationSubscription(notificationListener);
                Notifications.removeNotificationSubscription(responseListener);
              };
            } catch (err) {
              console.error('Error getting push token:', err);
            }
          }
        } catch (error) {
          console.error('Error loading Expo modules:', error);
          // Fallback zu Web Push Notifications
          if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              console.log('Web notifications permitted');
            }
          }
        }
      }
    }

    setupNotifications();
  }, []);

  return <Component {...pageProps} />
}

export default MyApp;