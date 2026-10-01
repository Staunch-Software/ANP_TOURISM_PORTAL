import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import API from '../api/client';

export function AIChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', text: 'Hi there! I am the Andaman Tourism AI. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!user) return null; // Only show for logged-in users

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // We pass the token via API client headers automatically
      const res = await API.post('/chat', { message: userText });
      setMessages(prev => [...prev, { id: Date.now(), type: 'bot', text: res.data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'bot', 
        text: 'Sorry, I am having trouble connecting to the server right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 overflow-hidden flex flex-col mb-4 max-h-[500px]">
          {/* Header */}
          <div className="bg-navy-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Andaman Tourism AI</h3>
                <p className="text-[10px] text-cyan-200">Powered by Gemini</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4 min-h-[300px]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.type === 'user' ? 'bg-slate-200 text-slate-500' : 'bg-cyan-100 text-cyan-700'
                }`}>
                  {msg.type === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                  msg.type === 'user' 
                    ? 'bg-navy-800 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none whitespace-pre-wrap'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-4 py-2.5 bg-white border border-slate-100 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                  <span className="text-xs text-slate-400 font-medium tracking-wide">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form onSubmit={handleSubmit} className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about ferries, attractions..."
                className="w-full bg-slate-100 text-sm text-slate-800 rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 p-1.5 text-cyan-600 disabled:text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-700 hover:bg-cyan-600 text-white rounded-full p-4 shadow-xl hover:shadow-cyan-600/30 transition-all hover:-translate-y-1 group flex items-center gap-2"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="font-bold pr-1 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
            Ask AI Assistant
          </span>
        </button>
      )}
    </div>
  );
}
