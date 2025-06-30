import { get, post, put, del } from "./request";

export async function getNotificationList(searchParm) {
  const data = await get("notification/list?sender=admin&" + searchParm);
  return data?.data;
}

export async function readNotification(notificationId) {
  const data = await put(`notification/${notificationId}/mark-as-read`);
  return data?.data;
}

export async function readAllNotification() {
  const data = await put("notification/markAllAsRead/admin");
  return data?.data;
}

export async function getUnreadNotificationCount() {
    const data = await get("notification/unread-count");
    return data?.data;
  }

  export async function deleteNotification(notificationId) {
    const data = await del(`notification/${notificationId}`);
    return data;
  }