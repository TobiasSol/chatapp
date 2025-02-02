// components/NotificationPermission.js
const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Subscription im Backend speichern
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };