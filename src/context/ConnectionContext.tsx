import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getDeviceInfo } from '../utils/deviceUtils';
import { Room, ConnectionState } from '../types';
import { generateRoomCode } from '../utils/roomUtils';

interface ConnectionContextType {
  connectionState: ConnectionState;
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  isConnecting: boolean;
  error: string | null;
  socket: Socket | null;
  serverConnected: boolean;
}

const initialState: ConnectionState = {
  room: null,
  connected: false,
  devices: [],
  isHost: false,
};

const SOCKET_URL = 'https://139.59.38.179:3000';

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(initialState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [serverConnected, setServerConnected] = useState(false);

  // Initialize socket connection with enhanced retry logic
  useEffect(() => {
    const connectSocket = () => {
      const newSocket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'], // Try polling first, then WebSocket
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 10000, // Increased timeout
        forceNew: true,
      });

      newSocket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setServerConnected(false);
        
        if (retryCount < 2) {
          // Try fallback to polling only if both fail
          console.log('Retrying with polling transport only...');
          const fallbackSocket = io(SOCKET_URL, {
            transports: ['polling'], // Force polling only
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            timeout: 10000,
            forceNew: true,
          });
          
          setSocket(fallbackSocket);
          setRetryCount(prev => prev + 1);
        } else {
          setError(`Connection failed after multiple attempts. Please check your internet connection and try again.`);
          setIsConnecting(false);
        }
      });

      newSocket.on('connect', () => {
        console.log('Successfully connected to server');
        setError(null);
        setRetryCount(0);
        setServerConnected(true);
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [retryCount]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected to server');
      setError(null);
      setServerConnected(true);
    });

    socket.on('room:joined', (data: { room: Room; isHost: boolean }) => {
      setConnectionState({
        room: data.room,
        connected: true,
        devices: data.room.devices,
        isHost: data.isHost,
      });
      setIsConnecting(false);
      setError(null);
    });

    socket.on('room:updated', (data: { room: Room }) => {
      setConnectionState(prev => ({
        ...prev,
        room: data.room,
        devices: data.room.devices,
      }));
    });

    socket.on('room:error', (error: string) => {
      setError(error);
      setIsConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnectionState(initialState);
      setServerConnected(false);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Server initiated disconnect or transport closed, try to reconnect
        socket.connect();
      }
      
      setError('Disconnected from server. Attempting to reconnect...');
    });

    return () => {
      socket.off('connect');
      socket.off('room:joined');
      socket.off('room:updated');
      socket.off('room:error');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket]);

  const createRoom = async (): Promise<string> => {
    if (!socket) throw new Error('Socket not initialized');
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const deviceInfo = getDeviceInfo();
      const roomCode = generateRoomCode();
      
      return new Promise((resolve, reject) => {
        socket.connect();
        
        // Add timeout for room creation
        const timeout = setTimeout(() => {
          reject(new Error('Room creation timed out'));
        }, 10000);

        socket.emit('room:create', {
          code: roomCode,
          device: deviceInfo,
        });

        // Wait for room:joined event
        socket.once('room:joined', () => {
          clearTimeout(timeout);
          resolve(roomCode);
        });

        socket.once('room:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error));
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMessage);
      setIsConnecting(false);
      throw err;
    }
  };

  const joinRoom = async (code: string): Promise<boolean> => {
    if (!socket) throw new Error('Socket not initialized');
    
    setIsConnecting(true);
    setError(null);
    
    try {
      const deviceInfo = getDeviceInfo();
      
      return new Promise((resolve, reject) => {
        socket.connect();
        
        // Add timeout for joining room
        const timeout = setTimeout(() => {
          reject(new Error('Join room timed out'));
        }, 10000);

        socket.emit('room:join', {
          code,
          device: deviceInfo,
        });

        socket.once('room:joined', () => {
          clearTimeout(timeout);
          resolve(true);
        });

        socket.once('room:error', (error) => {
          clearTimeout(timeout);
          reject(new Error(error));
        });
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMessage);
      setIsConnecting(false);
      return false;
    }
  };

  const leaveRoom = useCallback(() => {
    if (socket) {
      // Emit room:leave event first
      socket.emit('room:leave');
      // Clear connection state
      setConnectionState(initialState);
      // Clear any errors
      setError(null);
      // Disconnect socket
      socket.disconnect();
      // Create a new socket connection
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
        forceNew: true,
      });
      setSocket(newSocket);
    }
  }, [socket]);

  // Handle socket disconnection
  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = (reason: string) => {
      console.log('Disconnected:', reason);
      setConnectionState(initialState);
      setServerConnected(false);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Server initiated disconnect or transport closed, try to reconnect
        socket.connect();
      }
      
      setError('Disconnected from server. Attempting to reconnect...');
    };

    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return (
    <ConnectionContext.Provider 
      value={{ 
        connectionState, 
        createRoom, 
        joinRoom, 
        leaveRoom,
        isConnecting,
        error,
        socket,
        serverConnected
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = (): ConnectionContextType => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};