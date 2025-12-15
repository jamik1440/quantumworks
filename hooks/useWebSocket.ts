/**
 * React Hook for WebSocket Connection
 * Handles connection, reconnection, and message queuing
 */
import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  getToken?: () => string | null;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    getToken = () => {
      // Try to get token from memory storage or localStorage
      return localStorage.getItem('token');
    }
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  const connect = useCallback(() => {
    const token = getToken();
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host.replace(':3000', ':8000')}/ws?token=${encodeURIComponent(token)}`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(msg));
          }
        }
        
        onOpen?.();
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          // Handle authentication
          if (data.type === 'authenticated') {
            console.log('WebSocket authenticated');
            return;
          }
          
          // Handle heartbeat
          if (data.type === 'heartbeat' || data.type === 'pong') {
            return;
          }
          
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      socket.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        setIsConnected(false);
        onClose?.();
        
        // Reconnect logic
        if (reconnectAttempts < maxReconnectAttempts && event.code !== 1008) {
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttempts),
            30000 // Max 30 seconds
          );
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached or connection closed by server');
        }
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [getToken, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onMessage, onError, onOpen, onClose]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(message);
      
      // Try to reconnect if not already connecting
      if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
        connect();
      }
    }
  }, [isConnected, reconnectAttempts, maxReconnectAttempts, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setReconnectAttempts(maxReconnectAttempts); // Prevent reconnection
  }, [maxReconnectAttempts]);

  useEffect(() => {
    connect();
    
    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping' });
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
      disconnect();
    };
  }, []); // Only on mount

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

