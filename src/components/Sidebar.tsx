// src/components/Sidebar.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FilePlus2,
  Receipt,
  Boxes,
  Images,
  Sun,
  Moon,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/invoice", label: "New Invoice", icon: FilePlus2 },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/gallery", label: "Gallery", icon: Images },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onProfileClick: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  onProfileClick,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function setThemeMode(dark: boolean) {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }

  const renderNavLinks = (isMobile: boolean = false) => (
    <nav className="flex flex-col gap-1.5">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;

        if (collapsed && !isMobile) {
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`group relative flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-all ${
                active
                  ? "bg-pine text-surface font-medium shadow-xs"
                  : "text-ink-soft hover:bg-line/60 hover:text-ink"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              if (isMobile && onMobileClose) onMobileClose();
            }}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-pine text-surface font-medium"
                : "text-ink-soft hover:bg-line/60 hover:text-ink"
            }`}
          >
            <Icon size={17} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderFooter = (isCollapsed: boolean = false) => {
    if (isCollapsed) {
      return (
        <div className="flex flex-col items-center gap-3 border-t border-line pt-3">
          <button
            type="button"
            onClick={onProfileClick}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-sm font-semibold text-surface shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title={`Account Profile: ${user?.username || "User"} (${user?.role || "staff"})`}
            aria-label="Open profile & settings"
          >
            {user?.username?.slice(0, 1).toUpperCase()}
          </button>

          <button
            type="button"
            onClick={() => setThemeMode(!isDark)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-paper text-ink-soft hover:text-ink hover:bg-line/50 transition-colors cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-line/60 cursor-pointer"
          title="Open profile & settings"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-semibold text-surface">
            {user?.username?.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {user?.username}
            </span>
            <span className="block text-xs capitalize text-ink-soft">
              {user?.role}
            </span>
          </span>
        </button>

        <div className="flex items-center rounded-md border border-line bg-paper p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setThemeMode(false)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1 font-medium transition-all cursor-pointer ${
              !isDark
                ? "bg-surface text-pine-deep shadow-sm font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Sun size={13} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setThemeMode(true)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1 font-medium transition-all cursor-pointer ${
              isDark
                ? "bg-surface text-pine-deep shadow-sm font-semibold"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Moon size={13} />
            <span>Dark</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex shrink-0 flex-col justify-between border-r border-line bg-paper-flat relative transition-all duration-300 ease-in-out ${
          collapsed ? "w-16 px-2 py-4" : "w-56 px-3 py-4"
        }`}
      >
        {/* Desktop edge border toggle button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex absolute -right-3 top-6 z-20 h-6 w-6 items-center justify-center rounded-full border border-line bg-surface shadow-xs text-ink-soft hover:text-ink hover:bg-paper hover:scale-110 transition-all cursor-pointer"
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        )}

        <div>
          {collapsed ? (
            <div className="mb-6 flex flex-col items-center gap-2.5">
              <svg className="h-6 w-6 shrink-0" viewBox="0 0 256 256" fill="none">
                <circle cx="128" cy="128" r="116" fill="#0284c7" />
                <path d="M 0 196 Q 48 180, 96 190 T 192 188 T 256 196 L 256 256 L 0 256 Z" fill="#0369a1" opacity="0.6" />
                <ellipse cx="128" cy="180" rx="40" ry="14" fill="#3e2723" />
                <path d="M 128 178 C 126 150, 130 114, 128 88" stroke="#14532d" strokeWidth="6" strokeLinecap="round" />
                <path d="M 128 152 C 94 146, 68 122, 74 92 C 104 98, 126 118, 128 152 Z" fill="#4ade80" />
                <path d="M 128 134 C 162 126, 188 102, 182 72 C 152 80, 130 102, 128 134 Z" fill="#86efac" />
                <path d="M 128 88 C 117 68, 120 48, 128 34 C 136 48, 139 68, 128 88 Z" fill="#bbf7d0" />
              </svg>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-paper text-ink-soft hover:text-pine-deep hover:bg-pine-tint/40 transition-colors cursor-pointer shadow-2xs"
                  title="Expand sidebar (Ctrl+B)"
                  aria-label="Expand sidebar"
                >
                  <PanelLeftOpen size={15} />
                </button>
              )}
            </div>
          ) : (
            <div className="mb-6 px-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <svg className="h-6 w-6 shrink-0" viewBox="0 0 256 256" fill="none">
                  <circle cx="128" cy="128" r="116" fill="#0284c7" />
                  <path d="M 0 196 Q 48 180, 96 190 T 192 188 T 256 196 L 256 256 L 0 256 Z" fill="#0369a1" opacity="0.6" />
                  <ellipse cx="128" cy="180" rx="40" ry="14" fill="#3e2723" />
                  <path d="M 128 178 C 126 150, 130 114, 128 88" stroke="#14532d" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 128 152 C 94 146, 68 122, 74 92 C 104 98, 126 118, 128 152 Z" fill="#4ade80" />
                  <path d="M 128 134 C 162 126, 188 102, 182 72 C 152 80, 130 102, 128 134 Z" fill="#86efac" />
                  <path d="M 128 88 C 117 68, 120 48, 128 34 C 136 48, 139 68, 128 88 Z" fill="#bbf7d0" />
                </svg>
                <span className="font-serif text-sm font-semibold leading-tight tracking-tight text-pine-deep truncate">
                  Sri Vijaya Lakshmi
                  <span className="block text-[11px] font-sans font-normal text-ink-soft truncate">
                    Nursery & Farm
                  </span>
                </span>
              </div>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-soft hover:text-ink hover:bg-line/60 transition-colors cursor-pointer"
                  title="Collapse sidebar (Ctrl+B)"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
              )}
            </div>
          )}
          {renderNavLinks(false)}
        </div>
        {renderFooter(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside className="relative flex h-full w-64 max-w-[85vw] flex-col justify-between border-r border-line bg-paper-flat px-4 py-4 shadow-xl">
            <div>
              <div className="mb-6 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <svg className="h-6 w-6 shrink-0" viewBox="0 0 256 256" fill="none">
                    <circle cx="128" cy="128" r="116" fill="#0284c7" />
                    <path d="M 0 196 Q 48 180, 96 190 T 192 188 T 256 196 L 256 256 L 0 256 Z" fill="#0369a1" opacity="0.6" />
                    <ellipse cx="128" cy="180" rx="40" ry="14" fill="#3e2723" />
                    <path d="M 128 178 C 126 150, 130 114, 128 88" stroke="#14532d" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 128 152 C 94 146, 68 122, 74 92 C 104 98, 126 118, 128 152 Z" fill="#4ade80" />
                    <path d="M 128 134 C 162 126, 188 102, 182 72 C 152 80, 130 102, 128 134 Z" fill="#86efac" />
                    <path d="M 128 88 C 117 68, 120 48, 128 34 C 136 48, 139 68, 128 88 Z" fill="#bbf7d0" />
                  </svg>
                  <span className="font-serif text-sm font-semibold leading-tight tracking-tight text-pine-deep">
                    Sri Vijaya Lakshmi
                    <span className="block text-[11px] font-sans font-normal text-ink-soft">
                      Nursery & Farm
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="rounded p-1.5 text-ink-soft hover:bg-line/60 hover:text-ink cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>
              {renderNavLinks(true)}
            </div>
            {renderFooter(false)}
          </aside>
        </div>
      )}
    </>
  );
}
