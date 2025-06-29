// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { getJwtToken } from '../store/token';
import { showSystemNotification } from '../utils/notification'; // 👈 引入通知函数
import { addMessageListener, initSocket, joinUserRoom, leaveUserRoom, removeMessageListener } from '../utils/socket';

interface UseSocketOptions {
  eventName?: string;
  onMessage?: (data: any) => void;
  userId?: string;
  autoJoinRoom?: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { eventName, onMessage, userId, autoJoinRoom = true } = options;
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = await getJwtToken();
        if (!token) {
          console.warn('No token available for socket connection');
          return;
        }

        const socket = initSocket(token);
        socketRef.current = socket;

        if (userId && autoJoinRoom) {
          joinUserRoom(userId);
        }

        // 通用监听：处理 new_notification 事件
        addMessageListener('new_notification', (data) => {
          console.log('📨 new_notification received:', data);
          const { title, message } = data;
          showSystemNotification(title || '新通知', message || '你有一条新消息');
        });

        // 监听自定义事件
        if (eventName && onMessage) {
          addMessageListener(eventName, onMessage);
        }

        console.log('🔌 Socket initialized with options:', options);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initializeSocket();

    return () => {
      if (eventName) {
        removeMessageListener(eventName);
      }
      if (userId && autoJoinRoom) {
        leaveUserRoom(userId);
      }
      removeMessageListener('new_notification'); // 👈 清理通知监听
    };
  }, [eventName, onMessage, userId, autoJoinRoom]);

  return {
    socket: socketRef.current,
    addListener: (event: string, callback: (data: any) => void) => {
      addMessageListener(event, callback);
    },
    removeListener: (event: string) => {
      removeMessageListener(event);
    },
  };
};
