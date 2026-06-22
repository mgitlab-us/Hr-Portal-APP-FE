import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../lib/axios';
import { useAuthStore } from '../features/auth/store';

const SOCKET_URL = API_URL.replace('/api/v1', '');

export const useSocket = (event?: string, callback?: (data: any) => void) => {
  const employee = useAuthStore((s) => s.employee);
  const companyId = employee?.companyId;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!companyId) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { companyId },
      transports: ['websocket'],
      forceNew: true
    });

    const socket = socketRef.current;

    if (event && callback) {
      socket.on(event, (data) => {
        if (data.companyId === companyId) {
          callback(data);
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [companyId, event, callback]);

  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, { ...data, companyId });
    }
  };

  return { socket: socketRef.current, emit };
};
