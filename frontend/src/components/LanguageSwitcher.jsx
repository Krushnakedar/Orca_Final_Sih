import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🇮🇳" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", flag: "🇮🇳" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", flag: "🇮🇳" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200">
      <Globe
        className="w-3.5 h-3.5 text-ocean-400 shrink-0"
        aria-hidden="true"
      />
      <label htmlFor="language-switcher" className="sr-only">
        Select language
      </label>
      <select
        id="language-switcher"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent font-semibold text-slate-100 focus:outline-none cursor-pointer text-xs"
        aria-label="Select language"
      >
        {LANGUAGES.map((lang) => (
          <option
            key={lang.code}
            value={lang.code}
            className="bg-slate-900 text-slate-100"
          >
            {lang.flag} {lang.nativeLabel} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
}
