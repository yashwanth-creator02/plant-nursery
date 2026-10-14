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
  - `translateItem()`, `translateCategory()` in `src/lib/language-context.tsx`.
  - Plant name transliterations in `src/lib/plant-translations.ts`.

## Git Safety (If Modifying Code)
- Develop all translation enhancements and UI adjustments on dedicated branches (`feat/i18n-<name>` or `fix/i18n-<name>`).
- Never push directly to `main`. Require explicit confirmation before merging.

## Tools / Scripts to Use
- Automated description translator: `scripts/translate-all-descriptions.ts`.
- Category migration tool: `scripts/migrate-categories-kn.ts`.
- TypeScript verification: `python execution/run_typecheck.py`.

## Outputs
- Seamless language toggle between English and Kannada without UI clipping or horizontal card distortion.
- Fully translated invoices and receipts for local nursery customers.

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
- **Missing Translation Fallback**: Always default back to English text if a specific Kannada key or category slug is undefined.
- **Database Bilingual Storage**: Preserve both `name` and `nameKn`, `description` and `descriptionKn` in the database to prevent loss of local naming.
