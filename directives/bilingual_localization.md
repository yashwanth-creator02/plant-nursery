# Directive: Bilingual Localization (Kannada & English)

## Goal
Maintain consistent, accurate, and overflow-safe bilingual translations across all client UI components, inputs, placeholders, invoice sheets, and data modals.

## When this fires
- Adding or editing any user-facing text, button labels, modal headers, or input placeholders.
- Implementing new stock items, categories, or invoice print layouts.
- Diagnosing and fixing layout overflows in non-Latin scripts (specifically Kannada `kn`).

## Inputs
- Current language state from `useLanguage()` (`src/lib/language-context.tsx`).
- Translation dictionaries and helper functions:
  - `translateItem()`, `translateCategory()`, `translateUnit()` in `src/lib/language-context.tsx`.
  - On-the-fly Google translation API with fallback: `translateOnTheFly()` in `src/lib/translator.ts`.
  - Plant name transliterations in `src/lib/plant-translations.ts`.

## Git Safety (If Modifying Code)
- Develop all translation enhancements and UI adjustments on dedicated branches (`feat/i18n-<name>` or `fix/i18n-<name>`).
- Never push directly to `main`. Require explicit confirmation before merging.

## Tools / Scripts to Use
- Automated description translator: `scripts/translate-all-descriptions.ts`.
- Category migration tool: `scripts/migrate-categories-kn.ts`.
- On-the-fly translation API route: `src/app/api/translate/route.ts`.
- TypeScript verification: `python execution/run_typecheck.py` or `npx tsc --noEmit`.

## Outputs
- Seamless language toggle between English and Kannada without UI clipping or horizontal card distortion.
- Fully translated invoices and receipts for local nursery customers.
- 1-click on-the-fly translation assistance during stock item, category, subcategory, photo description, and custom line item entry.

## Edge Cases & Error Handling
- **Kannada Glyph Width Overflow**:
  - Kannada characters include ascenders, descenders, and complex conjuncts (ottu) that require ~25-40% more horizontal space than Latin glyphs.
  - Use punchy, industry-standard terms:
    - "All": `ಎಲ್ಲಾ` instead of verbose `ಎಲ್ಲವೂ`.
    - "With Photos": `ಫೋಟೋ ಸಹಿತ` instead of `ಫೋಟೋಗಳೊಂದಿಗೆ`.
    - "Needs Photos": `ಫೋಟೋ ಬೇಕು` or `ಫೋಟೋ ಬಾಕಿ` instead of `ಫೋಟೋ ಬೇಕಾಗಿದೆ`.
    - Search placeholders: `ಹೆಸರು, ವರ್ಗ ಅಥವಾ ವಿವರಣೆ ಹುಡುಕಿ...` instead of full sentences.
  - Never use rigid `shrink-0` on button groups or pill wrappers without `max-w-full overflow-x-auto`.
  - Apply `.scrollbar-none` to scrollable pill containers to keep mobile and desktop interfaces clean.
  - Use `whitespace-nowrap px-2 sm:px-2.5` to prevent awkward mid-word breaks while ensuring buttons fit compact viewports.
- **Single Clean Language Toggle Placement**:
  - Keep a single language toggle (`CompactLanguageToggle` or header toggle).
  - Never duplicate the language toggle in sidebar menus next to the nursery branding on mobile or desktop views.
- **On-the-Fly Google Translation Integration**:
  - Use `translateOnTheFly(text, targetLang)` from `src/lib/translator.ts` for instant translation buttons (`ಅನುವಾದಿಸು (Translate 🔄)`).
  - Always provide fallback to local nursery botanical dictionaries when Google Cloud Translation API is offline or unconfigured.
  - Auto-translate on blur or save if Kannada input was left blank during category/item creation.
- **Browser Confirmations and Alerts (`window.confirm` & `window.alert`)**:
  - Always format browser dialogs conditionally using active language:
    ```tsx
    const confirmMsg = language === "kn" ? "..." : "...";
    if (!confirm(confirmMsg)) return;
    ```
- **Universal Common Action Keys**:
  - Always use shared translation keys for universal buttons: `t("cancel")` ("ರದ್ದುಮಾಡಿ") and `t("close")` ("ಮುಚ್ಚಿ").
- **Missing Translation Fallback**: Always default back to English text if a specific Kannada key or category slug is undefined.
- **Database Bilingual Storage**: Preserve both `name` and `nameKn`, `description` and `descriptionKn` in the database to prevent loss of local naming.
