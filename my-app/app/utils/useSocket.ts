// src/hooks/useSocket.ts
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getJwtToken } from '../store/token';
import { AppSocket, ClientToServerEvents, ServerToClientEvents } from '../types/socket';
import { getSocket, initSocket } from '../utils/socket';

let globalSocket: AppSocket | null = null;

export const useSocket = <K extends keyof ServerToClientEvents>(
  event?: K,
  listener?: ((...args: any[]) => void) | undefined
) => {
  const [token, setToken] = useState<string | null>(null);

  // 异步获取 token
  useEffect(() => {
    const fetchToken = async () => {
      const jwtToken = await getJwtToken();
      setToken(jwtToken);
    };
    fetchToken();
  }, []);

  // 初始化 Socket 连接
  useEffect(() => {
    if (!token) return;

    // 如果已经有全局 socket，直接使用
    if (globalSocket && globalSocket.connected) {
      if (event && listener) {
        globalSocket.on(event, listener as any);
      }
      return () => {
        if (event && listener) {
          globalSocket?.off(event, listener as any);
        }
      };
    }

    // 创建新的 socket 连接
    const socket = initSocket(token);
    globalSocket = socket;

    // 注册事件监听
    if (event && listener) {
      socket.on(event, listener as any);
    }

    return () => {
      if (event && listener) {
        socket.off(event, listener as any);
      }
      // 不要在这里断开连接，保持单一长连接
    };
  }, [token, event, listener]);

  // 类型安全的 emit 方法
  const emit = useCallback(<T extends keyof ClientToServerEvents>(
    event: T,
    ...args: Parameters<ClientToServerEvents[T]>
  ) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit(event, ...args);
    } else {
      console.warn('Socket 未连接');
    }
  }, []);

  const isConnected = useMemo(() => globalSocket?.connected ?? false, []);

  return { 
    socket: globalSocket,
    emit,
    isConnected
  };
};