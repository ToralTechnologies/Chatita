'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { UserContext } from '@/types';
import ChatOptionsMenu from './chat-options-menu';
import { useTranslation } from '@/lib/i18n/context';

interface NearbyPlace {
  name: string;
  cuisine?: string;
  distance?: string;
  rating?: number;
}

// Does this message ask for food options near the user? Checked locally (free)
// so the Places API is only ever called for real nearby-food requests.
// NOTE: no \b at the edges — JS \b is ASCII-only and fails after accented
// characters (e.g. "cerca de mí"), which would silently break the Spanish side.
const NEARBY_INTENT =
  /(\bnear me\b|\bnearby\b|\bclose by\b|\baround here\b|\bnear here\b|\bwalking distance\b|\bclosest\b|\b(?:restaurants?|food|places?|options?|eat) (?:near|around|close)\b|cerca de m[ií]|cerquita|por aqu[ií]|aqu[ií] cerca|d[oó]nde (?:puedo )?comer|qu[eé] hay cerca|restaurantes? cerca|lugares? cerca)/i;

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

type ChatT = ReturnType<typeof useTranslation>['t'];

function getGreeting(t: ChatT, ctx?: UserContext): string {
  const c = t.chatUi;
  if (ctx?.feelingOverwhelmed) return c.greetOverwhelmed;
  if (ctx?.notFeelingWell) return c.greetNotWell;
  if (ctx?.mood === 'anxious') return c.greetAnxious;
  if (ctx?.mood === 'sad') return c.greetSad;
  if (ctx?.mood === 'tired') return c.greetTired;
  if (ctx?.onPeriod || ctx?.havingCravings) return c.greetCravings;
  if (ctx?.mood === 'grateful') return c.greetGrateful;
  if (ctx?.mood === 'calm') return c.greetCalm;
  if (ctx?.mood === 'happy') return c.greetHappy;
  return c.greetDefault;
}

function getInitialSuggestions(t: ChatT, ctx?: UserContext): string[] {
  const c = t.chatUi;
  if (ctx?.feelingOverwhelmed) return [c.sugQuickHome, c.sugFindRestaurant, c.sugEncouragement];
  if (ctx?.notFeelingWell) return [c.sugYesPlease, c.sugWarm, c.sugJustWater];
  if (ctx?.mood === 'anxious') return [c.sugCalmEat, c.sugEncouragement, c.sugWhatToEat];
  if (ctx?.mood === 'sad') return [c.sugComfort, c.sugEncouragement, c.sugWhatToEat];
  if (ctx?.mood === 'tired') return [c.sugQuick, c.sugComfort, c.sugWhatToEat];
  if (ctx?.onPeriod || ctx?.havingCravings) return [c.sugSweet, c.sugSalty, c.sugComfort];
  return [c.sugWhatToEat, c.sugOverwhelmed, c.sugRestaurantTips];
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
  const { t, language } = useTranslation();
  const initialMessage: Message = {
    role: 'assistant',
    content: getGreeting(t, userContext),
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(() => getInitialSuggestions(t, userContext));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  // Location consent flow: message waiting on the user's location decision.
  // PRIVACY: coordinates go only to /api/restaurants/nearby for the lookup and
  // are never stored; the chat API receives place names/distances only.
  const [pendingLocationMessage, setPendingLocationMessage] = useState<string | null>(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const locationDeclinedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingLocationMessage, locationBusy]);

  const sendMessage = useCallback(async (messageText: string, nearbyPlaces?: NearbyPlace[]) => {
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
          language,
          ...(nearbyPlaces?.length ? { nearbyPlaces } : {}),
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
      setErrorMessage(t.chatUi.sendError);
      setLastFailedMessage(messageText);
      // Remove the user message we optimistically added
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [loading, userContext, language]);

  // Route a message through the location-consent flow when it asks for nearby
  // food; otherwise send directly. Permission is only ever requested in the
  // moment, for the message that needs it.
  const submitMessage = useCallback((messageText: string) => {
    if (!messageText.trim() || loading || locationBusy) return;
    if (
      NEARBY_INTENT.test(messageText) &&
      !locationDeclinedRef.current &&
      typeof navigator !== 'undefined' &&
      'geolocation' in navigator
    ) {
      setPendingLocationMessage(messageText);
      setInput('');
      return;
    }
    sendMessage(messageText);
  }, [loading, locationBusy, sendMessage]);

  const handleLocationAllow = async () => {
    const messageText = pendingLocationMessage;
    if (!messageText) return;
    setPendingLocationMessage(null);
    setLocationBusy(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 60000,
        })
      );
      const res = await fetch('/api/restaurants/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      });
      if (!res.ok) throw new Error('nearby lookup failed');
      const data = await res.json();
      const places: NearbyPlace[] = (data.restaurants || []).slice(0, 6).map((r: any) => ({
        name: r.name,
        cuisine: r.cuisine,
        distance: r.distance,
        rating: r.rating,
      }));
      setLocationBusy(false);
      sendMessage(messageText, places.length ? places : undefined);
    } catch {
      // Permission denied at browser level, timeout, or lookup failure:
      // fall back gracefully to the normal (no-location) answer.
      setLocationBusy(false);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t.chatLocation.locationError, timestamp: new Date() },
      ]);
      sendMessage(messageText);
    }
  };

  const handleLocationDeny = () => {
    const messageText = pendingLocationMessage;
    locationDeclinedRef.current = true; // don't re-ask this session
    setPendingLocationMessage(null);
    if (messageText) sendMessage(messageText);
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleSuggestionClick = (suggestion: string) => {
    submitMessage(suggestion);
  };

  const handleClearChat = async () => {
    try {
      await fetch('/api/chat', { method: 'DELETE' });
      setMessages([{ ...initialMessage, timestamp: new Date() }]);
      setSuggestions(getInitialSuggestions(t, userContext));
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
        const sender = m.role === 'user' ? t.chatUi.you : 'Chatita';
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
    setSuggestions(getInitialSuggestions(t, userContext));
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
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.chatUi.headerName}</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{t.chatUi.headerTagline}</p>
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
              aria-label={t.chatUi.closeChat}
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
          {userContext.mood === 'happy' && <ContextChip label={t.chatUi.chipFeelingGreat} />}
          {userContext.mood === 'grateful' && <ContextChip label={t.chatUi.chipGrateful} />}
          {userContext.mood === 'calm' && <ContextChip label={t.chatUi.chipCalm} />}
          {userContext.mood === 'tired' && <ContextChip label={t.chatUi.chipTired} />}
          {userContext.mood === 'anxious' && <ContextChip label={t.chatUi.chipAnxious} />}
          {userContext.mood === 'sad' && <ContextChip label={t.chatUi.chipDown} />}
          {userContext.notFeelingWell && <ContextChip label={t.chatUi.chipNotWell} />}
          {userContext.onPeriod && <ContextChip label={t.chatUi.chipPeriod} />}
          {userContext.feelingOverwhelmed && <ContextChip label={t.chatUi.chipOverwhelmed} />}
          {userContext.havingCravings && <ContextChip label={t.chatUi.chipCravings} />}
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

        {/* Location consent bubble — asked in the moment, never on load */}
        {pendingLocationMessage && (
          <div className="flex justify-start">
            <div
              className="max-w-[82%] px-4 py-3"
              style={{
                borderRadius: '18px 18px 18px 4px',
                background: 'var(--bg-card-alt)',
                border: '1px solid rgba(1,35,116,0.14)',
                boxShadow: '0 4px 12px -4px rgba(1,35,116,0.12)',
              }}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#C8932B' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {t.chatLocation.consentPrompt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={handleLocationAllow}
                  className="text-xs font-semibold transition-all active:scale-95"
                  style={{ minHeight: 44, padding: '10px 18px', borderRadius: '99px', background: '#012374', color: '#FFFDF9', border: 'none' }}
                >
                  {t.chatLocation.allow}
                </button>
                <button
                  onClick={handleLocationDeny}
                  className="text-xs font-semibold transition-all active:scale-95"
                  style={{ minHeight: 44, padding: '10px 18px', borderRadius: '99px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid rgba(1,35,116,0.22)' }}
                >
                  {t.chatLocation.deny}
                </button>
              </div>
            </div>
          </div>
        )}

        {(loading || locationBusy) && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3"
              style={{ borderRadius: '18px 18px 18px 4px', background: 'var(--bg-card-alt)' }}
            >
              {locationBusy ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.chatLocation.searching}</p>
              ) : (
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'rgba(1,35,116,0.4)', animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              )}
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
                {t.chatUi.retry}
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
            placeholder={t.chatUi.inputPlaceholder}
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
          {t.chatUi.disclaimer}
        </p>
      </form>
    </div>
  );
}
