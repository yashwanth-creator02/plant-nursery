"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";

type BrandSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Accessible name for the form and the handle button. */
  label: string;
  /** Announced after a submit, for example "Showing 12 of 40 items." */
  resultSummary: string;
  emptyMessage: string;
};

/**
 * Brand sliding-door search. Filtering happens live through onChange; the submit
 * only snaps the door shut and announces how many results are left.
 */
export function BrandSearchBar({
  value,
  onChange,
  placeholder,
  label,
  resultSummary,
  emptyMessage,
}: BrandSearchBarProps) {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="brand-search-wrap">
      <form
        role="search"
        className={`brand-search${submitted ? " is-submitted" : ""}`}
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest(".brand-search-handle")) {
            inputRef.current?.focus();
          }
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!value.trim()) {
            setSubmitted(false);
            inputRef.current?.focus();
            setStatus(emptyMessage);
            return;
          }
          setSubmitted(true);
          inputRef.current?.blur();
          setStatus(resultSummary);
        }}
      >
        {/* No aria-hidden here: the door wraps the real submit control. */}
        <span className="brand-search-door">
          <button type="submit" className="brand-search-handle" aria-label={label}>
            <Search size={14} strokeWidth={2.2} />
          </button>
        </span>
        <input
          ref={inputRef}
          type="search"
          className="brand-search-input"
          value={value}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            onChange(event.target.value);
            setSubmitted(false);
            if (!event.target.value) setStatus("");
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            onChange("");
            setSubmitted(false);
            setStatus("");
          }}
        />
      </form>
      <p className="brand-search-status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
