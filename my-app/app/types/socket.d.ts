// src/types/socket.d.ts
import { Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  new_notification: (data: NotificationData) => void;
  update_status: (response: OperationResponse) => void;
  error: (error: SocketError) => void;
  [key: string]: (...args: any[]) => void; // 允许动态事件名称
}

export interface ClientToServerEvents {
  mark_as_read: (data: MarkAsReadData, callback?: (res: OperationResponse) => void) => void;
  join_room: (data: { room: string }) => void;
  leave_room: (data: { room: string }) => void;
  [key: string]: (...args: any[]) => void; // 允许动态事件名称
}

export interface SocketEvents extends ServerToClientEvents, ClientToServerEvents {}

// 数据类型定义
export interface NotificationData {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface OperationResponse {
  success: boolean;
  error?: string;
  notificationId?: string;
}

export interface SocketError {
  message: string;
  code?: number;
}


export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;