'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Trash2, Download, RefreshCw, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

interface ChatOptionsMenuProps {
  onClearChat: () => void;
  onExportChat: () => void;
  onNewChat: () => void;
  onSettings?: () => void;
}

export default function ChatOptionsMenu({
  onClearChat,
  onExportChat,
  onNewChat,
  onSettings,
}: ChatOptionsMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearChat = () => {
    setIsOpen(false);
    if (confirm(t.chatUi.clearConfirm)) {
      onClearChat();
    }
  };

  const options = [
    {
      label: t.chatUi.newConversation,
      icon: RefreshCw,
      onClick: () => {
        setIsOpen(false);
        onNewChat();
      },
    },
    {
      label: t.chatUi.exportChat,
      icon: Download,
      onClick: () => {
        setIsOpen(false);
        onExportChat();
      },
    },
    ...(onSettings
      ? [
          {
            label: t.chatUi.chatSettings,
            icon: Settings,
            onClick: () => {
              setIsOpen(false);
              onSettings();
            },
          },
        ]
      : []),
    {
      label: t.chatUi.clearHistory,
      icon: Trash2,
      onClick: handleClearChat,
      destructive: true,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={t.chatUi.chatOptions}
      >
        <MoreVertical className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={option.onClick}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                option.destructive
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <option.icon className="w-4 h-4 flex-shrink-0" />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
