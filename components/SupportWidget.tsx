import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Loader2, Minimize2 } from 'lucide-react';
import { chatWithSupport } from '../services/geminiService';

interface SupportMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const SupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([
    { id: 'init', role: 'model', text: "System Online. Nexus Interface initialized. Awaiting your command, Operator." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: SupportMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const responseText = await chatWithSupport(history, userMsg.text);
      const botMsg: SupportMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: SupportMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "Connection error. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-black/90 backdrop-blur-xl border border-nexus-cyan/30 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.15)] flex flex-col overflow-hidden ring-1 ring-white/10"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-nexus-cyan/10 to-transparent flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-nexus-cyan/20 flex items-center justify-center border border-nexus-cyan/50">
                   <Bot size={18} className="text-nexus-cyan" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">NEXUS SUPPORT</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400 uppercase">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <Minimize2 size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
               {messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-nexus-cyan text-black font-medium rounded-tr-sm' 
                        : 'bg-white/10 text-gray-200 border border-white/5 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                 </div>
               ))}
               {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-2">
                       <Loader2 size={14} className="animate-spin text-nexus-cyan" />
                       <span className="text-xs text-gray-500">Computing response...</span>
                    </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-black/40 border-t border-white/10 flex gap-2">
               <input 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder="Type your query..."
                 className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-nexus-cyan/50 transition-colors placeholder:text-gray-600"
               />
               <button 
                 type="submit" 
                 disabled={!input.trim() || isLoading}
                 className="p-2 bg-nexus-cyan text-black rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Send size={18} />
               </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.3)] transition-all ${
          isOpen 
            ? 'bg-gray-800 text-white border border-white/20' 
            : 'bg-gradient-to-br from-nexus-cyan to-blue-600 text-white border border-white/20'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
};

export default SupportWidget;