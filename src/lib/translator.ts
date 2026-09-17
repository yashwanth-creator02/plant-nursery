// src/lib/translator.ts

import { Language } from "./language-context";
import { translateItemName } from "./plant-translations";

/**
 * Translates any arbitrary text on the fly using Google Translation API
 * with automatic fallback to offline nursery plant dictionary.
 */
export async function translateOnTheFly(
  text: string,
  toLang: Language = "kn",
  fromLang?: Language | "auto"
): Promise<string> {
  const clean = text?.trim();
  if (!clean) return "";

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: clean,
        to: toLang,
        from: fromLang || "auto",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.translatedText) {
        return data.translatedText;
      }
    }
  } catch (err) {
    console.warn("Translation API call failed, falling back to dictionary:", err);
  }

  // Fallback to local dictionary
  return translateItemName(clean, toLang);
}
