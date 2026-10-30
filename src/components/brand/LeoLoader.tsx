"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import LeoLoaderEngine from "./leo-loader.js";

type LeoLoaderTheme = "dark" | "light";

interface LeoLoaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  theme?: LeoLoaderTheme;
  minHeight?: string;
  fullscreen?: boolean;
}

function resolveTheme(): LeoLoaderTheme {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function LeoLoader({
  title = "Sri Vijayalakshmi Nursery",
  subtitle = "Loading...",
  className = "",
  theme,
  minHeight,
  fullscreen = false,
}: LeoLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const loader = new LeoLoaderEngine({
      container,
      theme: theme ?? resolveTheme(),
      title,
      subtitle,
    });

    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      if (!theme) loader.setTheme(resolveTheme());
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      if (!theme) loader.setTheme(resolveTheme());
    };
    media.addEventListener("change", handleMediaChange);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", handleMediaChange);
      loader.complete();
      container.innerHTML = "";
    };
  }, [title, subtitle, theme]);

  const hostStyle = {
    minHeight: fullscreen ? "100vh" : minHeight,
    background: fullscreen ? "var(--paper)" : undefined,
    "--destination-accent": "var(--rust)",
  } as CSSProperties;

  return (
    <div
      className={`grid w-full place-items-center ${fullscreen ? "p-6" : ""} ${className}`}
      style={hostStyle}
    >
      <div ref={containerRef} className="w-full max-w-md" />
    </div>
  );
}
