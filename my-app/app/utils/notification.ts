// src/utils/notification.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '默认通道',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
};

export const showSystemNotification = async (
  title: string,
  body: string
) => {
  if (Platform.OS === 'web') {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  } else {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // 立即触发
    });
  }
};
