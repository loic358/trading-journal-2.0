
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Trade } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface ChatBotProps {
    trades: Trade[];
}

const ChatBot: React.FC<ChatBotProps> = ({ trades }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: '1', 
        role: 'model', 
        text: "Hello! I'm your TradePulse Assistant. I have access to your recent trade data and can help you analyze trends, explain concepts, or brainstorm strategies. How can I help you today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session with Context
  useEffect(() => {
    if (!chatSessionRef.current) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Build Context String
            const recentTrades = trades.slice(0, 30).map(t => 
                `- ${t.entryDate}: ${t.type} ${t.symbol} | P&L: ${t.pnl} | Setup: ${t.setup} | Status: ${t.status}`
            ).join('\n');
            
            const stats = {
                totalTrades: trades.length,
                netPnl: trades.reduce((acc, t) => acc + t.pnl, 0),
                winRate: trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length * 100).toFixed(1) + '%' : '0%'
            };

            const systemContext = `
                You are an expert trading assistant within the TradePulse application. 
                Your tone is professional, concise, and direct (hedge fund style).
                
                USER CONTEXT:
                - Total Trades: ${stats.totalTrades}
                - Net P&L: $${stats.netPnl}
                - Win Rate: ${stats.winRate}
                
                RECENT TRADES LOG:
                ${recentTrades}
                
                INSTRUCTIONS:
                1. Use the trade log above to answer questions about the user's specific performance if asked.
                2. If the user asks general trading questions, provide expert advice based on technical analysis and risk management principles.
                3. Format responses using Markdown (bold key terms, use lists).
                4. Do not hallucinates trades not in the list.
            `;

            chatSessionRef.current = ai.chats.create({
                model: 'gemini-3-pro-preview',
                config: {
                    systemInstruction: systemContext,
                }
            });
        } catch (error) {
            console.error("Failed to initialize Gemini:", error);
        }
    }
  }, [trades]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
        
        let fullResponse = '';
        const modelMsgId = (Date.now() + 1).toString();
        
        // Add placeholder for model message
        setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '' }]);

        for await (const chunk of resultStream) {
            const c = chunk as GenerateContentResponse;
            const text = c.text;
            if (text) {
                fullResponse += text;
                setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullResponse } : m));
            }
        }
    } catch (error) {
        console.error("Chat Error:", error);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm having trouble connecting right now. Please check your internet connection or API key configuration." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <div className="p-8 h-full flex flex-col animate-fade-in text-slate-900 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-red rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
                <Sparkles size={24} />
            </div>
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900">AI Assistant</h2>
                <p className="text-slate-500 font-medium">Powered by Gemini 1.5 Pro • Context Aware</p>
            </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
                            ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-brand-blue/10 text-brand-blue'}
                        `}>
                            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        
                        <div className={`
                            max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-slate-900 text-white rounded-tr-sm' 
                                : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-sm prose prose-sm prose-slate max-w-none'
                            }
                        `}>
                            {msg.role === 'model' ? (
                                <ReactMarkdown 
                                    components={{
                                        // Override markdown styles for better fit
                                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                        code: ({node, ...props}) => <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono text-slate-900" {...props} />,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 mt-1">
                             <Bot size={16} />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <form 
                    onSubmit={handleSend}
                    className="relative flex items-center bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-blue/20 focus-within:border-brand-blue transition-all shadow-sm"
                >
                    <div className="pl-4 text-slate-400">
                        <MessageSquare size={20} />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me about your performance (e.g., 'What is my win rate on EURUSD?')"
                        className="w-full bg-transparent px-4 py-4 text-slate-900 focus:outline-none placeholder:text-slate-400"
                        disabled={isLoading}
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="mr-2 p-2 rounded-lg bg-brand-blue text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">AI can make mistakes. Please verify important information.</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatBot;
