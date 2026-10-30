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
  symbolOnly?: boolean;
  size?: number;
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
  symbolOnly = true,
  size,
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

    // Restart the plume draw after the finished form holds, without calling
    // replay() so the delayed report link is not rescheduled.
    const restartDraw = () => {
      const node = container.querySelector<HTMLElement>("#leo-loader-root");
      if (!node) return;
      node.classList.remove("state-entrance");
      void node.offsetWidth;
      node.classList.add("state-entrance");
    };
    const redrawTimer = window.setInterval(restartDraw, 6600);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", handleMediaChange);
      window.clearInterval(redrawTimer);
      loader.complete();
      container.innerHTML = "";
    };
  }, [title, subtitle, theme]);

  const hostStyle = {
    minHeight: fullscreen ? "100vh" : minHeight,
    background: fullscreen ? "var(--paper)" : undefined,
    "--destination-accent": "var(--rust)",
    "--leo-symbol-size": `${size ?? (fullscreen ? 160 : 96)}px`,
  } as CSSProperties;

  return (
    <div
      className={`grid w-full place-items-center ${fullscreen ? "p-6" : ""} ${
        symbolOnly ? "leo-symbol-only" : ""
      } ${className}`}
      style={hostStyle}
    >
      <div
        ref={containerRef}
        className={symbolOnly ? "flex items-center justify-center" : "w-full max-w-md"}
      />
    </div>
  );
}
