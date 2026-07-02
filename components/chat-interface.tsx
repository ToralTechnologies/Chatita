'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, AlertCircle, RefreshCw } from 'lucide-react';
import { UserContext } from '@/types';
import ChatOptionsMenu from './chat-options-menu';

interface ChatInterfaceProps {
  userContext?: UserContext;
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
}

function getGreeting(ctx?: UserContext): string {
  if (ctx?.feelingOverwhelmed) {
    return "Hi. I can see you're feeling a bit overwhelmed — that's okay. Let's take it one step at a time. How can I help you right now?";
  }
  if (ctx?.notFeelingWell) {
    return "I see you're not feeling well today. I'm here to help — take things easy. What do you need?";
  }
  if (ctx?.mood === 'anxious') {
    return "I can see you're feeling anxious today. That's okay — let's take things slow. Would you like some calming meal ideas, or just someone to talk with?";
  }
  if (ctx?.mood === 'sad') {
    return "I'm sorry you're feeling down today. I'm right here. Sometimes a good meal can help a little — want me to suggest something comforting?";
  }
  if (ctx?.mood === 'tired') {
    return "I see you're feeling tired today. Let's keep things easy and simple. Want me to suggest some no-fuss meal ideas?";
  }
  if (ctx?.onPeriod || ctx?.havingCravings) {
    return "I see you've got some cravings going on. Let's find something satisfying that's also kind to your blood sugar. What sounds good?";
  }
  if (ctx?.mood === 'grateful') {
    return "Glad you're feeling grateful today — that positive energy helps everything. What can I help you with?";
  }
  if (ctx?.mood === 'calm') {
    return "Glad you're feeling calm today. Let's keep that good energy going. What can I help you with?";
  }
  if (ctx?.mood === 'happy') {
    return "Great to see you're in a good mood today. Let's keep it going — what can I help you with?";
  }
  return "Hello, I'm Chatita.\n\nI'm here to help you understand your food, blood sugar, and daily choices. What would you like to talk about today?";
}

function getInitialSuggestions(ctx?: UserContext): string[] {
  if (ctx?.feelingOverwhelmed) return ['Something quick at home', 'Find a restaurant', 'I need encouragement'];
  if (ctx?.notFeelingWell) return ['Yes, please', 'I need something warm', 'Just water for now'];
  if (ctx?.mood === 'anxious') return ['Something calm to eat', 'I need encouragement', 'What should I eat?'];
  if (ctx?.mood === 'sad') return ['Comfort food', 'I need encouragement', 'What should I eat?'];
  if (ctx?.mood === 'tired') return ['Something quick', 'Need something quick', 'What should I eat?'];
  if (ctx?.onPeriod || ctx?.havingCravings) return ['Something sweet', 'Something salty', 'Comfort food'];
  return ['What should I eat?', 'I feel overwhelmed', 'Restaurant tips'];
}

function ContextChip({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: '5px 10px',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: 500,
        background: 'var(--bg-card)',
        color: '#012374',
        border: '1px solid rgba(1,35,116,0.18)',
      }}
    >
      {label}
    </span>
  );
}

export default function ChatInterface({ userContext, onClose }: ChatInterfaceProps) {
  const initialMessage: Message = {
    role: 'assistant',
    content: getGreeting(userContext),
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(() => getInitialSuggestions(userContext));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setSuggestions([]);
    setErrorMessage(null);
    setLastFailedMessage(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          context: userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to send message:', error);
      setErrorMessage("I couldn't send that message. Please try again.");
      setLastFailedMessage(messageText);
      // Remove the user message we optimistically added
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [loading, userContext]);

  const handleRetry = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClearChat = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' });
      setMessages([{ ...initialMessage, timestamp: new Date() }]);
      setSuggestions(getInitialSuggestions(userContext));
      setErrorMessage(null);
      setLastFailedMessage(null);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleExportChat = () => {
    const text = messages
      .map((m) => {
        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sender = m.role === 'user' ? 'You' : 'Chatita';
        return `[${time}] ${sender}: ${m.content}`;
      })
      .join('\n\n');

    // UTF-8 BOM + explicit charset: without them, Windows apps (Notepad, Excel)
    // guess CP-1252 and render apostrophes/emoji/Spanish accents as mojibake
    // (â€™, ðŸ’™, Ã©). The BOM makes the encoding unambiguous.
    const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatita-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewChat = () => {
    setMessages([{ ...initialMessage, timestamp: new Date() }]);
    setSuggestions(getInitialSuggestions(userContext));
    setErrorMessage(null);
    setLastFailedMessage(null);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-card)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          borderBottom: '1px solid rgba(1,35,116,0.08)',
          background: 'var(--bg-card)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[11px] flex items-center justify-center"
            style={{ background: '#012374' }}
          >
            <img src="/logo-icon.svg" alt="Chatita" className="w-5 h-5" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Chatita</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Your caring companion</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ChatOptionsMenu
            onClearChat={handleClearChat}
            onExportChat={handleExportChat}
            onNewChat={handleNewChat}
          />
          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-card-alt)' }}
              aria-label="Close chat"
            >
              <X className="w-4 h-4" style={{ color: 'var(--text-primary)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Active context tags banner */}
      {userContext && Object.values(userContext).some(Boolean) && (
        <div
          className="px-4 py-2 flex flex-wrap gap-1.5"
          style={{ borderBottom: '1px solid rgba(1,35,116,0.08)', background: 'rgba(1,35,116,0.04)' }}
        >
          {userContext.mood === 'happy' && <ContextChip label="Feeling great" />}
          {userContext.mood === 'grateful' && <ContextChip label="Grateful" />}
          {userContext.mood === 'calm' && <ContextChip label="Feeling calm" />}
          {userContext.mood === 'tired' && <ContextChip label="Feeling tired" />}
          {userContext.mood === 'anxious' && <ContextChip label="Feeling anxious" />}
          {userContext.mood === 'sad' && <ContextChip label="Feeling down" />}
          {userContext.notFeelingWell && <ContextChip label="Not feeling well" />}
          {userContext.onPeriod && <ContextChip label="On my period" />}
          {userContext.feelingOverwhelmed && <ContextChip label="Overwhelmed" />}
          {userContext.havingCravings && <ContextChip label="Having cravings" />}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[82%] px-4 py-3"
              style={{
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user' ? '#012374' : 'var(--bg-card-alt)',
                boxShadow: msg.role === 'user'
                  ? '0 6px 16px -4px rgba(1,35,116,0.35)'
                  : '0 4px 12px -4px rgba(1,35,116,0.12)',
              }}
            >
              <p
                className="text-sm whitespace-pre-line leading-relaxed"
                style={{ color: msg.role === 'user' ? '#FFFDF9' : 'var(--text-primary)' }}
              >
                {msg.content}
              </p>
              <p
                className="text-[10px] mt-1.5"
                style={{ color: msg.role === 'user' ? 'rgba(255,253,249,0.6)' : 'var(--text-muted)' }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3"
              style={{ borderRadius: '18px 18px 18px 4px', background: 'var(--bg-card-alt)' }}
            >
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'rgba(1,35,116,0.4)', animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div
            className="flex items-center gap-2 px-4 py-3 text-sm rounded-[14px]"
            style={{ background: 'rgba(208,2,27,0.08)', border: '1px solid rgba(208,2,27,0.25)', color: '#D0021B' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            {lastFailedMessage && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 text-xs font-semibold underline shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div
          className="px-4 py-2.5"
          style={{ borderTop: '1px solid rgba(1,35,116,0.08)' }}
        >
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs font-semibold transition-all active:scale-95"
                style={{
                  padding: '7px 13px',
                  borderRadius: '99px',
                  background: 'var(--bg-card-alt)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(1,35,116,0.18)',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 pb-4 pt-3"
        style={{ borderTop: '1px solid rgba(1,35,116,0.08)' }}
      >
        <div
          className="flex items-center gap-2 px-2 py-1"
          style={{
            borderRadius: '999px',
            border: '1px solid rgba(1,35,116,0.15)',
            background: 'var(--bg-card-alt)',
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none disabled:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
            style={{ background: '#012374' }}
          >
            <Send className="w-4 h-4" style={{ color: '#FFFDF9' }} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          Chatita provides general guidance. Always consult your doctor for medical advice.
        </p>
      </form>
    </div>
  );
}
