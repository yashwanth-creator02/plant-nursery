// src/components/LanguageToggle.tsx

"use client";

import React from "react";
import { useLanguage, Language } from "@/lib/language-context";

interface LanguageToggleProps {
  size?: "sm" | "md";
  className?: string;
}

/**
 * Global Language Switch Toggle
 * Designed with clean architectural lines (rounded-md/sm) adhering to anti-vibecoding standards.
 */
export function LanguageToggle({
  size = "sm",
  className = "",
}: LanguageToggleProps) {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const isKn = language === "kn";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggleLanguage();
    }
  };

  const isSm = size === "sm";

  return (
    <div
      role="switch"
      aria-checked={isKn}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      title={isKn ? t("switchToEn") : t("switchToKn")}
      aria-label={t("toggleLanguageAria")}
      className={`relative inline-flex items-center select-none rounded-md border border-line-strong bg-paper/95 p-0.5 shadow-2xs transition-colors hover:border-pine/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/50 cursor-pointer ${
        isSm ? "h-7 text-[11px]" : "h-8 text-xs"
      } ${className}`}
    >
      {/* Sliding background indicator */}
      <div
        className={`absolute top-0.5 bottom-0.5 rounded-[4px] bg-pine shadow-xs transition-all duration-200 ease-out ${
          isKn ? "left-1/2 right-0.5" : "left-0.5 right-1/2"
        }`}
        aria-hidden="true"
      />

      {/* English button segment */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          setLanguage("en");
        }}
        className={`relative z-10 flex flex-1 items-center justify-center rounded-[4px] px-2 py-0.5 font-semibold transition-colors duration-150 cursor-pointer ${
          !isKn ? "text-surface" : "text-ink-soft hover:text-ink"
        }`}
      >
        <span>ENG</span>
      </button>

      {/* Kannada button segment */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          setLanguage("kn");
        }}
        className={`relative z-10 flex flex-1 items-center justify-center rounded-[4px] px-2 py-0.5 font-semibold transition-colors duration-150 cursor-pointer ${
          isKn ? "text-surface" : "text-ink-soft hover:text-ink"
        }`}
      >
        <span>ಕನ್ನಡ</span>
      </button>
    </div>
  );
}

/**
 * Preview Bill Language Switch Toggle
 * Used directly on Step 2 (Bill Preview) toolbar to override the global language specifically for the bill preview and printed receipt.
 */
interface PreviewLanguageToggleProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
}

export function PreviewLanguageToggle({
  currentLang,
  onLanguageChange,
  className = "",
}: PreviewLanguageToggleProps) {
  const isKn = currentLang === "kn";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onLanguageChange(isKn ? "en" : "kn");
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-[11px] font-semibold text-ink-soft whitespace-nowrap">
        {isKn ? "ಬಿಲ್ ಭಾಷೆ:" : "Bill Language:"}
      </span>
      <div
        role="switch"
        aria-checked={isKn}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        title={isKn ? "Switch bill receipt to English" : "Switch bill receipt to Kannada (ಕನ್ನಡ)"}
        aria-label="Toggle bill preview receipt language"
        className="relative inline-flex items-center select-none rounded-md border border-[#1b365d]/40 bg-surface p-0.5 h-7 text-[11px] shadow-2xs hover:border-[#1b365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b365d]/40 cursor-pointer"
      >
        {/* Sliding background indicator */}
        <div
          className={`absolute top-0.5 bottom-0.5 rounded-[4px] bg-[#1b365d] shadow-xs transition-all duration-200 ease-out ${
            isKn ? "left-1/2 right-0.5" : "left-0.5 right-1/2"
          }`}
          aria-hidden="true"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onLanguageChange("en");
          }}
          className={`relative z-10 flex flex-1 items-center justify-center rounded-[4px] px-2.5 py-0.5 font-bold transition-colors duration-150 cursor-pointer ${
            !isKn ? "text-white" : "text-[#1b365d]/70 hover:text-[#1b365d]"
          }`}
        >
          ENG
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onLanguageChange("kn");
          }}
          className={`relative z-10 flex flex-1 items-center justify-center rounded-[4px] px-2.5 py-0.5 font-bold transition-colors duration-150 cursor-pointer ${
            isKn ? "text-white" : "text-[#1b365d]/70 hover:text-[#1b365d]"
          }`}
        >
          ಕನ್ನಡ
        </button>
      </div>
    </div>
  );
}

/**
 * Compact icon/badge toggle for collapsed sidebar
 */
export function CompactLanguageToggle({ className = "" }: { className?: string }) {
  const { language, toggleLanguage, t } = useLanguage();
  const isKn = language === "kn";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={isKn ? t("switchToEn") : t("switchToKn")}
      aria-label={t("toggleLanguageAria")}
      className={`group relative flex h-7 w-7 items-center justify-center rounded-md border border-line bg-paper text-ink-soft hover:text-pine-deep hover:bg-pine-tint/40 transition-all cursor-pointer shadow-2xs ${className}`}
    >
      <span className="text-[11px] font-bold tracking-tight text-pine">
        {isKn ? "ಕ" : "EN"}
      </span>
      <span className="sr-only">{isKn ? "Switch to English" : "Switch to Kannada"}</span>
    </button>
  );
}
