'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Language } from '@/lib/i18n/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = async (lang: Language) => {
    setSaving(true);
    setLanguage(lang);

    // Save to database
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: lang }),
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t.settings.language}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleLanguageChange('en')}
          disabled={saving}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${
            language === 'en'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🇺🇸 {t.settings.english}
        </button>
        <button
          onClick={() => handleLanguageChange('es')}
          disabled={saving}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all disabled:opacity-50 ${
            language === 'es'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🇲🇽 {t.settings.spanish}
        </button>
      </div>
      {saving && (
        <p className="text-xs text-gray-500 text-center">{t.settings.saving}</p>
      )}
    </div>
  );
}
