import { NextRequest, NextResponse } from "next/server";
import { translateItemName } from "@/lib/plant-translations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const targetLang = typeof body?.to === "string" ? body.to.trim().toLowerCase() : "kn";
    const sourceLang = typeof body?.from === "string" ? body.from.trim().toLowerCase() : "auto";

    if (!text) {
      return NextResponse.json({ ok: true, translatedText: "" });
    }

    // 1. If official Google Cloud Translation API Key is provided in environment
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (apiKey) {
      try {
        const googleRes = await fetch(
          `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              q: text,
              target: targetLang,
              source: sourceLang !== "auto" ? sourceLang : undefined,
              format: "text",
            }),
          }
        );
        if (googleRes.ok) {
          const data = await googleRes.json();
          const translated = data?.data?.translations?.[0]?.translatedText;
          if (translated) {
            return NextResponse.json({
              ok: true,
              translatedText: translated,
              provider: "google_cloud",
            });
          }
        }
      } catch (e) {
        console.warn("Google Cloud Translation API error, attempting fallback:", e);
      }
    }

    // 2. Google Translate on-the-fly public API endpoint
    try {
      const sl = sourceLang || "auto";
      const tl = targetLang || "kn";
      const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=${encodeURIComponent(
        sl
      )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;

      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.[0])) {
          const translated = data[0]
            .map((chunk: any) => (Array.isArray(chunk) ? chunk[0] : ""))
            .filter(Boolean)
            .join("");

          if (translated && translated.trim()) {
            return NextResponse.json({
              ok: true,
              translatedText: translated.trim(),
              provider: "google_translate",
            });
          }
        }
      }
    } catch (err) {
      console.warn("Google Translate on-the-fly request error:", err);
    }

    // 3. Fallback to nursery offline plant dictionary
    const dictionaryMatch = translateItemName(text, targetLang as "kn" | "en");
    return NextResponse.json({
      ok: true,
      translatedText: dictionaryMatch || text,
      provider: "dictionary_fallback",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Translation failed" },
      { status: 500 }
    );
  }
}
