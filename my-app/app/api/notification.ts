// app/api/notification.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { del, get } from "./request";

interface NotificationParams {
  sender: 'system' | 'user';
  page: number;
  pageSize: number;
}

export interface Notification {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  is_read: number;
  sender: 'system' | 'user';
}

export async function getNotificationList(params: NotificationParams) {
  const urlParams = new URLSearchParams({
    sender: params.sender,
    page: params.page.toString(),
    pageSize: params.pageSize.toString()
  });

  const data = await get(`notification/list?${urlParams.toString()}`);
  
  // Cache notifications
  await cacheNotifications(data.data.list, params.sender);

  return {
    ...data.data,
    list: data.data.list
  };
}

export async function deleteNotificationById(id: number) {
  const result = await del(`notification/${id}`);
  
  // Remove from local cache
  await removeNotificationFromCache(id);
  
  return result;
}

// Local caching functions
export async function cacheNotifications(notifications: Notification[], sender: 'system' | 'user') {
  try {
    const existingNotifications = await getNotificationsFromCache(sender);
    const mergedNotifications = [
      ...notifications,
      ...existingNotifications
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 99); // Keep only the latest 99 notifications

    await AsyncStorage.setItem(
      `notifications_${sender}`, 
      JSON.stringify(mergedNotifications)
    );
  } catch (error) {
    console.error('Error caching notifications:', error);
  }
}

export async function getNotificationsFromCache(sender: 'system' | 'user'): Promise<Notification[]> {
  try {
    const cached = await AsyncStorage.getItem(`notifications_${sender}`);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error retrieving cached notifications:', error);
    return [];
  }
}

export async function removeNotificationFromCache(id: number) {
  try {
    const systemNotifications = await getNotificationsFromCache('system');
    const userNotifications = await getNotificationsFromCache('user');

    const updatedSystemNotifications = systemNotifications.filter(n => n.id !== id);
    const updatedUserNotifications = userNotifications.filter(n => n.id !== id);

    await AsyncStorage.setItem('notifications_system', JSON.stringify(updatedSystemNotifications));
    await AsyncStorage.setItem('notifications_user', JSON.stringify(updatedUserNotifications));
  } catch (error) {
    console.error('Error removing notification from cache:', error);
  }
}