// src/components/LanguageToggle.tsx

"use client";

import React from "react";
import { useLanguage } from "@/lib/language-context";
import { Languages } from "lucide-react";

interface LanguageToggleProps {
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export function LanguageToggle({
  size = "sm",
  className = "",
  showIcon = false,
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
      className={`relative inline-flex items-center select-none rounded-full border border-line-strong/80 bg-paper/90 p-0.5 shadow-2xs transition-colors hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/50 cursor-pointer ${
        isSm ? "h-7 text-[10.5px]" : "h-8 text-xs"
      } ${className}`}
    >
      {/* Sliding background indicator pill */}
      <div
        className={`absolute top-0.5 bottom-0.5 rounded-full bg-pine shadow-xs transition-all duration-200 ease-out ${
          isKn ? "left-1/2 right-0.5" : "left-0.5 right-1/2"
        }`}
        aria-hidden="true"
      />

      {/* English segment */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          setLanguage("en");
        }}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-0.5 font-semibold transition-colors duration-150 cursor-pointer ${
          !isKn ? "text-surface" : "text-ink-soft hover:text-ink"
        }`}
      >
        {showIcon && !isSm && <Languages size={12} className={!isKn ? "text-surface" : "text-ink-soft"} />}
        <span>ENG</span>
      </button>

      {/* Kannada segment */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          setLanguage("kn");
        }}
        className={`relative z-10 flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-0.5 font-semibold transition-colors duration-150 cursor-pointer ${
          isKn ? "text-surface" : "text-ink-soft hover:text-ink"
        }`}
      >
        <span>ಕನ್ನಡ</span>
      </button>
    </div>
  );
}

/**
 * Compact icon/badge toggle for collapsed sidebar or ultra-compact spaces
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
