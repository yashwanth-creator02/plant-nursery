// src/components/SmartStockPicker.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  X,
  Sprout,
  Package,
  Apple,
  Flower2,
  Trees,
  ShieldPlus,
  Sparkles,
  Layers,
  FlaskConical,
  Shovel,
  Wrench,
  Tag,
  Check,
} from "lucide-react";
import { formatMoney, StockItem } from "@/lib/types";

interface SmartStockPickerProps {
  stock: StockItem[];
  selectedId: string;
  onSelect: (stockItem: StockItem | null) => void;
  onEnterSubmit?: () => void;
  disabled?: boolean;
}

function getSubcategoryInfo(item: StockItem) {
  const isPlant = (item.category || "plants") === "plants";
  const sub = (item.subcategory || (isPlant ? "other" : "general")).toLowerCase();

  if (isPlant) {
    switch (sub) {
      case "fruit":
        return { label: "Fruit Plant", icon: Apple, color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "flower":
        return { label: "Flower Plant", icon: Flower2, color: "bg-pink-50 text-pink-700 border-pink-200" };
      case "ornamental":
        return { label: "Ornamental", icon: Trees, color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "medicinal":
        return { label: "Medicinal", icon: ShieldPlus, color: "bg-teal-50 text-teal-800 border-teal-200" };
      case "other":
        return { label: "Other Plant", icon: Sparkles, color: "bg-pine-tint text-pine-deep border-pine/20" };
      default:
        return {
          label: sub.charAt(0).toUpperCase() + sub.slice(1),
          icon: Sprout,
          color: "bg-pine-tint text-pine-deep border-pine/20",
        };
    }
  } else {
    switch (sub) {
      case "pots":
        return { label: "Pots & Planters", icon: Layers, color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "fertilizers":
        return { label: "Fertilizers", icon: FlaskConical, color: "bg-blue-50 text-blue-800 border-blue-200" };
      case "soil":
        return { label: "Soil & Substrates", icon: Shovel, color: "bg-stone-100 text-stone-800 border-stone-200" };
      case "tools":
        return { label: "Tools", icon: Wrench, color: "bg-violet-50 text-violet-800 border-violet-200" };
      default:
        return {
          label: sub === "general" ? "General Supplies" : sub.charAt(0).toUpperCase() + sub.slice(1),
          icon: Package,
          color: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  }
}

export function SmartStockPicker({
  stock,
  selectedId,
  onSelect,
  onEnterSubmit,
  disabled = false,
}: SmartStockPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<"all" | "plants" | "non-plants">("all");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(
    () => stock.find((s) => s.id === selectedId) || null,
    [stock, selectedId]
  );

  // Sync display search query when selected item changes or resets
  useEffect(() => {
    if (!selectedId) {
      setSearchQuery("");
    }
  }, [selectedId]);

  // Counts for category tabs
  const plantCount = useMemo(
    () => stock.filter((s) => (s.category || "plants") === "plants").length,
    [stock]
  );
  const nonPlantCount = useMemo(
    () => stock.filter((s) => s.category === "non-plants").length,
    [stock]
  );

  // Filtered items based on tab and query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return stock.filter((item) => {
      const isPlant = (item.category || "plants") === "plants";

      // Filter by category tab
      if (activeCategoryTab === "plants" && !isPlant) return false;
      if (activeCategoryTab === "non-plants" && isPlant) return false;

      // Filter by query
      if (!q) return true;

      const nameMatch = item.name.toLowerCase().includes(q);
      const subMatch = (item.subcategory || "").toLowerCase().includes(q);
      const catMatch = (item.category || "plants").toLowerCase().includes(q);
      const priceMatch = item.price.toString().includes(q);
      const unitMatch = (item.unit || "").toLowerCase().includes(q);

      return nameMatch || subMatch || catMatch || priceMatch || unitMatch;
    }).sort((a, b) => {
      if (!q) return 0;
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      // Prioritize items whose name starts with query
      if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
      if (!aName.startsWith(q) && bName.startsWith(q)) return 1;
      return 0;
    });
  }, [stock, searchQuery, activeCategoryTab]);

  // Keep highlighted index in range
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, activeCategoryTab]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(item: StockItem) {
    onSelect(item);
    setSearchQuery(item.name);
    setIsOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems.length > 0 && highlightedIndex < filteredItems.length) {
        handleSelect(filteredItems[highlightedIndex]);
      } else if (selectedItem && onEnterSubmit) {
        onEnterSubmit();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Box / Combobox Header */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`flex items-center gap-2 rounded-md border bg-surface px-2.5 py-1.5 text-sm transition-all cursor-text shadow-2xs ${
          isOpen
            ? "border-pine ring-2 ring-pine/15"
            : selectedItem
            ? "border-line-strong hover:border-pine/60"
            : "border-line-strong hover:border-pine/50"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <Search size={15} className="shrink-0 text-ink-soft/70" />

        <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
          {selectedItem && !isOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="truncate font-medium text-ink">
                {selectedItem.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-ink-soft">
                — ₹{formatMoney(Number(selectedItem.price))} ({selectedItem.quantity}{" "}
                {selectedItem.unit || "pcs"})
              </span>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Search by plant name, type (e.g. fruit, rose), or supply..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-soft/70 outline-none"
            />
          )}
        </div>

        {/* Clear button if something is selected or searched */}
        {(selectedItem || searchQuery) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
            title="Clear selection"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        )}

        <ChevronDown
          size={14}
          className={`shrink-0 text-ink-soft/80 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-pine" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu Panel */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[320px] rounded-lg border border-line-strong bg-surface shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          {/* Category Filter Tabs Header */}
          <div className="flex items-center gap-1 border-b border-line bg-paper-flat/70 p-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveCategoryTab("all")}
              className={`flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors cursor-pointer ${
                activeCategoryTab === "all"
                  ? "bg-surface font-semibold text-pine-deep shadow-2xs"
                  : "text-ink-soft hover:text-ink hover:bg-surface/50"
              }`}
            >
              <span>All</span>
              <span className="rounded-full bg-line/60 px-1.5 py-0.1 text-[10px]">
                {stock.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryTab("plants")}
              className={`flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors cursor-pointer ${
                activeCategoryTab === "plants"
                  ? "bg-surface font-semibold text-pine-deep shadow-2xs"
                  : "text-ink-soft hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Sprout size={12} className="text-pine" />
              <span>Plants</span>
              <span className="rounded-full bg-pine-tint px-1.5 py-0.1 text-[10px] text-pine-deep font-semibold">
                {plantCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategoryTab("non-plants")}
              className={`flex items-center gap-1 rounded px-2 py-1 font-medium transition-colors cursor-pointer ${
                activeCategoryTab === "non-plants"
                  ? "bg-surface font-semibold text-pine-deep shadow-2xs"
                  : "text-ink-soft hover:text-ink hover:bg-surface/50"
              }`}
            >
              <Package size={12} className="text-slate-600" />
              <span>Non-Plants</span>
              <span className="rounded-full bg-slate-200/70 px-1.5 py-0.1 text-[10px] text-slate-700 font-semibold">
                {nonPlantCount}
              </span>
            </button>

            {searchQuery && (
              <span className="ml-auto pr-1 text-[11px] text-ink-soft">
                {filteredItems.length} found
              </span>
            )}
          </div>

          {/* List of Filtered Stock Items */}
          <div ref={listRef} className="max-h-64 overflow-y-auto p-1 divide-y divide-line/40">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-ink-soft">
                <Search size={18} className="mx-auto mb-1.5 opacity-40" />
                <p>No stock items match &ldquo;{searchQuery}&rdquo;</p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-[11px] font-medium text-pine-deep underline hover:opacity-80 cursor-pointer"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const info = getSubcategoryInfo(item);
                const Icon = info.icon;
                const isSelected = selectedId === item.id;
                const isHighlighted = idx === highlightedIndex;
                const lowStock = item.quantity > 0 && item.quantity <= 5;
                const outOfStock = item.quantity <= 0;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 text-xs transition-colors cursor-pointer ${
                      isHighlighted
                        ? "bg-pine-tint/40 text-pine-deep"
                        : isSelected
                        ? "bg-pine-tint/25 text-pine-deep"
                        : "hover:bg-paper-flat/80 text-ink"
                    }`}
                  >
                    {/* Left: Item Name and Category Badge */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate text-ink">
                          {item.name}
                        </span>
                        {isSelected && (
                          <Check size={14} className="shrink-0 text-pine stroke-[2.5]" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.2 text-[10px] font-medium ${info.color}`}
                        >
                          <Icon size={10} />
                          <span>{info.label}</span>
                        </span>

                        <span className="text-[11px] text-ink-soft">
                          Unit: {item.unit || "pcs"}
                        </span>
                      </div>
                    </div>

                    {/* Right: Price & Stock Availability */}
                    <div className="flex flex-col items-end shrink-0 gap-0.5 text-right">
                      <span className="font-mono text-sm font-bold text-ink">
                        ₹{formatMoney(Number(item.price))}
                      </span>

                      {outOfStock ? (
                        <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.2 font-mono text-[10px] font-bold text-red-700">
                          Out of stock
                        </span>
                      ) : lowStock ? (
                        <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-amber-900">
                          Only {item.quantity} left
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-ink-soft">
                          {item.quantity} in stock
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
