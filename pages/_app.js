// pages/_app.js
import '../styles/globals.css'
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

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
            projectId: Constants.expoConfig.extra.eas.projectId
          })).data;

          // Token in Supabase speichern
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
        } catch (err) {
          console.error('Error getting push token:', err);
        }
      }
    }

    setupNotifications();

    // Notification Handler
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Hier können Sie zur Chat-Seite navigieren wenn gewünscht
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return <Component {...pageProps} />
}

export default MyApp