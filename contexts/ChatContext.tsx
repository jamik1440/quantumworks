import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Message, ChatContact } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  messages: Message[];
  contacts: ChatContact[];
  activeContactId: string | null;
  setActiveContactId: (id: string | null) => void;
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isRecipientTyping: boolean;
  sendTypingSignal: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecipientTyping] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token');
    const wsUrl = `${wsProtocol}//localhost:8000/ws/${user.id}?token=${token}`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          const incomingMsg: Message = {
            id: Date.now().toString(),
            senderId: data.sender_id,
            receiverId: user.id,
            content: data.content,
            timestamp: data.timestamp,
            read: false
          };
          setMessages(prev => [...prev, incomingMsg]);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
      };

      socketRef.current = socket;
    } catch (error) {
      console.error("WebSocket connection failed, using mock mode", error);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  // Handle Active Contact Change (Read Status)
  useEffect(() => {
    if (activeContactId) {
      // 1. Mark existing unread messages from this contact as read
      setMessages(prev => prev.map(msg =>
        (msg.senderId === activeContactId && !msg.read)
          ? { ...msg, read: true }
          : msg
      ));

      // 2. Reset unread count for contact
      setContacts(prev => prev.map(c =>
        c.id === activeContactId ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [activeContactId]);

  const sendTypingSignal = () => {
    // In a real app, send a 'typing' event via WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'typing', recipient_id: activeContactId }));
    }
  };

  const sendMessage = (content: string) => {
    if (!user || !activeContactId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: activeContactId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => [...prev, newMessage]);

    // Update Last Message in Contact List
    setContacts(prev => prev.map(c =>
      c.id === activeContactId ? { ...c, lastMessage: content } : c
    ));

    // Send to WebSocket server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'personal_message',
        recipient_id: activeContactId,
        content: content
      }));
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      contacts,
      activeContactId,
      setActiveContactId,
      sendMessage,
      isConnected,
      isRecipientTyping,
      sendTypingSignal
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};