import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, MoreVertical, Search, Phone, Video, Check, CheckCheck } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ChatInterface: React.FC = () => {
  const { 
    messages, 
    contacts, 
    activeContactId, 
    setActiveContactId, 
    sendMessage,
    isRecipientTyping,
    sendTypingSignal
  } = useChat();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find(c => c.id === activeContactId);

  // Filter messages for current conversation
  const currentMessages = messages.filter(m => 
    (m.senderId === user?.id && m.receiverId === activeContactId) ||
    (m.senderId === activeContactId && m.receiverId === user?.id)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isRecipientTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    sendTypingSignal();
  };

  // Format timestamp helper
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!activeContactId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse border border-white/10 shadow-[0_0_30px_rgba(0,242,255,0.1)]">
          <Send size={32} className="text-nexus-cyan" />
        </div>
        <p className="font-light tracking-wide">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] w-full bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Sidebar - Contacts */}
      <div className="w-80 border-r border-white/10 flex flex-col bg-white/5">
        <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-nexus-cyan transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:border-nexus-cyan focus:outline-none focus:shadow-[0_0_15px_rgba(0,242,255,0.2)] transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {contacts.map(contact => (
            <motion.div
              key={contact.id}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              onClick={() => setActiveContactId(contact.id)}
              className={`p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all ${activeContactId === contact.id ? 'bg-gradient-to-r from-nexus-cyan/20 to-transparent border border-nexus-cyan/30' : 'border border-transparent'}`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full p-[2px] ${activeContactId === contact.id ? 'bg-gradient-to-tr from-nexus-cyan to-nexus-magenta' : 'bg-gray-700'}`}>
                   <div className="w-full h-full rounded-full overflow-hidden bg-black">
                     {contact.avatar ? <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800" />}
                   </div>
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-sm font-bold truncate ${activeContactId === contact.id ? 'text-white' : 'text-gray-300'}`}>{contact.name}</h4>
                  {contact.unreadCount > 0 && (
                    <span className="bg-nexus-magenta text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shadow-[0_0_10px_rgba(255,0,122,0.5)]">{contact.unreadCount}</span>
                  )}
                </div>
                <p className={`text-xs truncate ${contact.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-500'}`}>
                   {contact.lastMessage || 'No messages yet'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center backdrop-blur-xl bg-black/40 z-10 shadow-lg">
          <div className="flex items-center gap-3">
             <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-nexus-cyan to-nexus-magenta p-[1.5px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black">
                       {activeContact?.avatar ? <img src={activeContact.avatar} alt={activeContact.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800" />}
                    </div>
                 </div>
             </div>
             <div>
               <h3 className="font-bold text-white text-base leading-tight">{activeContact?.name}</h3>
               <div className="flex items-center gap-1.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${activeContact?.online ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-500'}`} />
                 <span className="text-xs text-gray-400 font-medium">{activeContact?.online ? 'Online' : 'Offline'}</span>
               </div>
             </div>
          </div>
          
          <div className="flex gap-4 text-gray-400">
            <button className="hover:text-nexus-cyan p-2 hover:bg-white/10 rounded-full transition-all"><Phone size={18} /></button>
            <button className="hover:text-nexus-cyan p-2 hover:bg-white/10 rounded-full transition-all"><Video size={18} /></button>
            <button className="hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"><MoreVertical size={18} /></button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-black/20 to-black/40">
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
               <p className="text-sm border border-white/10 px-4 py-2 rounded-full bg-white/5">{t.chat.noMessages}</p>
            </div>
          ) : (
            currentMessages.map((msg, index) => {
              const isMe = msg.senderId === user?.id;
              // Check if the previous message was from the same sender to group them visually
              const previous = index > 0 ? currentMessages[index - 1] : undefined;
              const isSequence = !!previous && previous.senderId === msg.senderId;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-1' : 'mt-4'}`}
                >
                   <div className={`max-w-[70%] relative group`}>
                     <div className={`px-4 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-sm
                       ${isMe 
                         ? 'bg-nexus-cyan/10 border border-nexus-cyan/20 text-white rounded-2xl rounded-tr-sm' 
                         : 'bg-white/10 border border-white/10 text-gray-100 rounded-2xl rounded-tl-sm'
                       }
                     `}>
                       {msg.content}
                     </div>
                     
                     {/* Metadata: Time + Read Receipt */}
                     <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-500 opacity-70 ${isMe ? 'justify-end' : 'justify-start'}`}>
                       <span>{formatTime(msg.timestamp)}</span>
                       {isMe && (
                         <span title={msg.read ? "Read" : "Sent"}>
                           {msg.read ? <CheckCheck size={12} className="text-nexus-cyan" /> : <Check size={12} />}
                         </span>
                       )}
                     </div>
                   </div>
                </motion.div>
              );
            })
          )}
          
          {/* Typing Indicator */}
          <AnimatePresence>
            {isRecipientTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-start mt-4"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 w-fit">
                   <div className="w-1.5 h-1.5 bg-nexus-cyan/80 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_-0.32s]" />
                   <div className="w-1.5 h-1.5 bg-nexus-cyan/80 rounded-full animate-[bounce_1.4s_infinite_ease-in-out_-0.16s]" />
                   <div className="w-1.5 h-1.5 bg-nexus-cyan/80 rounded-full animate-[bounce_1.4s_infinite_ease-in-out]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <form onSubmit={handleSend} className="flex gap-3 items-center">
            <button type="button" className="text-gray-400 hover:text-nexus-cyan transition-colors p-2 hover:bg-white/5 rounded-full">
              <Paperclip size={20} />
            </button>
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={handleInputChange}
                placeholder={t.chat.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:border-nexus-cyan focus:outline-none focus:bg-white/10 transition-all placeholder:text-gray-500"
              />
            </div>
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="bg-nexus-cyan text-black p-3 rounded-xl hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;