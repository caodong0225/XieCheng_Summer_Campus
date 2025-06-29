// src/utils/socket.ts
import { io } from 'socket.io-client';
import { AppSocket } from '../types/socket';

let socket: AppSocket | null = null;

export const initSocket = (token: string): AppSocket => {
  if (!socket) {
    console.log('🔌 Initializing socket with token:', token ? 'Token Present' : 'No Token');
    
    socket = io('ws://localhost:3002', {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,  // Enable reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token },
      query: { 
        appVersion: '1.0.0',
        clientType: 'mobile-app'
      }
    }) as AppSocket;

    // More comprehensive event logging
    socket
      .on('connect', () => {
        console.log('💻 Client Socket Connected');
        console.log('Socket ID:', socket?.id);
      })
      .on('connect_error', (err) => {
        console.error('💥 Connection Error:', err);
        console.error('Error Details:', {
          message: err.message
        });
      })
      .on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
      });
  }
  return socket;
};
  

const addBaseListeners = () => {
  if (!socket) return;

  socket
    .on('connect', () => console.log('✅ WebSocket connected'))
    .on('disconnect', (reason: string) => {
      console.log(`Disconnected: ${reason}`);
      if (reason === 'io server disconnect') socket?.connect();
    })
    .on('connect_error', (err: Error) => {
      console.log('Connection error:', err.message);
    });
};

export const getSocket = (): AppSocket | null => socket;

// 添加消息监听器
export const addMessageListener = (eventName: string, callback: (data: any) => void) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot add message listener');
    return;
  }

  (socket as any).on(eventName, (data: any) => {
    console.log(`📨 Received ${eventName}:`, data);
    callback(data);
  });
};

// 移除消息监听器
export const removeMessageListener = (eventName: string) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot remove message listener');
    return;
  }

  (socket as any).off(eventName);
};

// 加入用户房间
export const joinUserRoom = (userId: string) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot join room');
    return;
  }

  (socket as any).emit('join_room', { room: `user_${userId}` });
  console.log(`🏠 Joined room: user_${userId}`);
};

// 离开用户房间
export const leaveUserRoom = (userId: string) => {
  if (!socket) {
    console.warn('Socket not initialized, cannot leave room');
    return;
  }

  (socket as any).emit('leave_room', { room: `user_${userId}` });
  console.log(`🚪 Left room: user_${userId}`);
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};