'use client';

import { useI18n } from '@/lib/i18n/context';
import { Language } from '@/lib/i18n/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t.settings.language}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setLanguage('en')}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
            language === 'en'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🇺🇸 {t.settings.english}
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={`py-3 px-4 rounded-lg font-medium text-sm transition-all ${
            language === 'es'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🇲🇽 {t.settings.spanish}
        </button>
      </div>
    </div>
  );
}
