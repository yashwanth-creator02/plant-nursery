"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, Receipt, Boxes, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/invoice", label: "New Invoice", icon: FilePlus2 },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/stock", label: "Stock", icon: Boxes },
];

export function Sidebar({ onProfileClick }: { onProfileClick: () => void }) {
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

  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-line bg-paper-flat px-3 py-4">
      <div>
        <div className="mb-6 px-2">
          <span className="font-serif text-lg font-semibold tracking-tight text-pine-deep">
            Ledger
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-pine text-surface font-medium"
                    : "text-ink-soft hover:bg-line/60 hover:text-ink"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <div className="flex items-center rounded-md border border-line bg-paper p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setThemeMode(false)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1 font-medium transition-all ${
              !isDark
                ? "bg-surface text-pine-deep shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Sun size={13} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setThemeMode(true)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1 font-medium transition-all ${
              isDark
                ? "bg-surface text-pine-deep shadow-sm"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Moon size={13} />
            <span>Dark</span>
          </button>
        </div>

        <button
          onClick={onProfileClick}
          className="flex items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-line/60"
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
      </div>
    </aside>
  );
}
