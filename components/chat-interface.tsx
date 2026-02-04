'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { UserContext } from '@/types';

interface ChatInterfaceProps {
  userContext?: UserContext;
  onClose?: () => void;
}

function getGreeting(ctx?: UserContext): string {
  if (ctx?.feelingOverwhelmed) {
    return "Hi mi amor, I see you're feeling a bit overwhelmed. 💙 That's okay — let's take it one step at a time. How can I help you right now?";
  }
  if (ctx?.notFeelingWell) {
    return "Hey there, mi amor. I see you're not feeling well today. 🤒 I'm here to help — just take things easy. What do you need?";
  }
  if (ctx?.onPeriod || ctx?.havingCravings) {
    return "Hi sweetheart! I see you've got some cravings going on. 💛 Let's find something satisfying that's also kind to your blood sugar. What sounds good?";
  }
  return "Hello, mi amor! I'm Chatita, here to help you. 💙\n\nWhat would you like to talk about today?";
}

export default function ChatInterface({ userContext, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: getGreeting(userContext),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const getInitialSuggestions = (): string[] => {
    if (userContext?.feelingOverwhelmed) return ['Something quick at home', 'Find a restaurant', 'I need encouragement'];
    if (userContext?.notFeelingWell) return ['Yes, please', 'I need something warm', 'Just water for now'];
    if (userContext?.onPeriod || userContext?.havingCravings) return ['Something sweet', 'Something salty', 'Comfort food'];
    return ['What should I eat?', 'I feel overwhelmed', 'Restaurant tips'];
  };
  const [suggestions, setSuggestions] = useState<string[]>(getInitialSuggestions);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context: userContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary/5">
        <div className="flex items-center gap-3">
          <img src="/logo-icon.svg" alt="Chatita" className="w-10 h-10" />
          <div>
            <h3 className="font-semibold">Chatita</h3>
            <p className="text-xs text-gray-600">Your caring companion</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Active context tags banner */}
      {userContext && Object.values(userContext).some(Boolean) && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex flex-wrap gap-1.5">
          {userContext.notFeelingWell && <span className="text-xs bg-white rounded-full px-2 py-0.5 shadow-sm">🤒 Not feeling well</span>}
          {userContext.onPeriod && <span className="text-xs bg-white rounded-full px-2 py-0.5 shadow-sm">🩸 On my period</span>}
          {userContext.feelingOverwhelmed && <span className="text-xs bg-white rounded-full px-2 py-0.5 shadow-sm">😰 Feeling overwhelmed</span>}
          {userContext.havingCravings && <span className="text-xs bg-white rounded-full px-2 py-0.5 shadow-sm">🍫 Having cravings</span>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          💙 Chatita provides general guidance. Always consult your doctor for medical advice.
        </p>
      </form>
    </div>
  );
}
