"use client";
import { useChangeLocale, useCurrentLocale } from '../../i18n';

export default function LocaleSwitcher() {
  const changeLocale = useChangeLocale();
  const currentLocale = useCurrentLocale();

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => changeLocale('en')} 
        className={`px-3 py-1 text-sm rounded ${currentLocale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}
      >
        ENG
      </button>
      <button 
        onClick={() => changeLocale('zh-CN')}
        className={`px-3 py-1 text-sm rounded ${currentLocale === 'zh-CN' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}
      >
        CN
      </button>
    </div>
  );
} 