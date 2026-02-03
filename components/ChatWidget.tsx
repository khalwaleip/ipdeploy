import React, { useState, useRef, useEffect } from 'react';
import { Chat, GenerateContentResponse } from "@google/genai";
import { createChatSession } from '../services/geminiService';
import { sendEmailBrief } from '../services/emailService';
// Safe text renderer
const SafeMarkdown = ({ content }: { content: string }) => {
  if (!content) return null;
  return (
    <div className="whitespace-pre-wrap">
      {content.split('\n').map((line, i) => (
        <p key={i} className="mb-2">
          {line}
        </p>
      ))}
    </div>
  );
};

interface Message {
  role: 'user' | 'model';
  text: string;
  isAction?: boolean;
}

interface ChatWidgetProps {
  onStartReview: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onStartReview }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Greetings. I am Khatiebi. Welcome to the IP Division of Khalwale & Co Advocates. How may I facilitate your intellectual property protection today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      let fullText = '';
      let hasOfferedUpload = false;

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;

        // Handle potential function calls from Khatiebi
        if (c.functionCalls && c.functionCalls.length > 0) {
          const fc = c.functionCalls[0];
          if (fc.name === 'offerContractUpload') hasOfferedUpload = true;
          if (fc.name === 'sendLegalBrief') {
            const args = fc.args as any;
            await sendEmailBrief(args.email, args.recipientName, 'AI-CHAT', args.summary);
            setMessages(prev => [...prev, { role: 'model', text: `📧 **Status Update:** I have successfully dispatched the legal briefing to **${args.email}** for **${args.recipientName}**.` }]);
          }
        }

        if (c.text) {
          fullText += c.text;
          setMessages(prev => {
            const newHistory = [...prev];
            const lastMsg = newHistory[newHistory.length - 1];
            if (lastMsg.role === 'model') lastMsg.text = fullText;
            return newHistory;
          });
        }
      }

      if (hasOfferedUpload) {
        setMessages(prev => [...prev, { role: 'model', text: 'Initiate Professional Audit', isAction: true }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Forgive me, my connection to the legal database was interrupted. Please re-state your query." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-14 right-8 z-50 flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="bg-slate-900 border border-legal-gold/30 rounded-3xl shadow-2xl w-80 sm:w-96 h-[550px] mb-6 overflow-hidden pointer-events-auto flex flex-col animate-fade-in-up">
          <div className="bg-legal-800 p-6 border-b border-slate-700/50 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-white font-serif font-bold text-lg">Khatiebi <span className="text-legal-gold text-xs italic ml-1 font-sans opacity-70">IP Counsel</span></h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-900/98 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.isAction ? (
                  <button onClick={() => { setIsOpen(false); onStartReview(); }} className="w-full py-4 bg-legal-gold text-legal-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all">
                    {msg.text}
                  </button>
                ) : (
                  <div className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm ${msg.role === 'user' ? 'bg-legal-gold text-legal-900 font-bold' : 'bg-slate-800 text-slate-200 border border-slate-700/50 shadow-lg'}`}>
                    {msg.role === 'model' ? <div className="prose prose-invert prose-sm"><SafeMarkdown content={msg.text} /></div> : msg.text}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 bg-slate-800/50 border-t border-slate-700/50">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about royalty splits..."
                className="w-full bg-slate-900 border border-slate-600 rounded-2xl pl-5 pr-12 py-4 text-sm text-white focus:border-legal-gold outline-none transition-all focus:ring-1 focus:ring-legal-gold/20"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-legal-gold hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </form>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex flex-col items-center group relative animate-bounce-short transition-all hover:scale-105 active:scale-95"
      >
        <div className="mb-2 bg-legal-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-legal-gold/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-legal-gold text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">I'm Khatiebi</span>
        </div>

        <div className="relative w-20 h-20 rounded-full border-4 border-legal-900 shadow-2xl overflow-hidden bg-legal-gold transition-all hover:border-legal-gold">
          <img
            src="/assets/khatiebi.png"
            alt="Khatiebi AI"
            className="w-full h-full object-cover transform transition-transform group-hover:scale-110"
          />
          <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-legal-900 shadow-sm ${isOpen ? 'bg-legal-gold' : 'bg-green-500 animate-pulse'}`}></div>
        </div>

        <div className="mt-2 bg-legal-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-legal-gold/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Ask me</span>
        </div>

        {/* Persistent Badge for Mobile/Discovery */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 flex flex-col space-y-1 items-end md:hidden">
            <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-legal-900">Live</span>
          </div>
        )}
      </button>
    </div>
  );
};