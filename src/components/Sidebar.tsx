"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, Receipt, Boxes } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/invoice", label: "New Invoice", icon: FilePlus2 },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/stock", label: "Stock", icon: Boxes },
];

export function Sidebar({ onProfileClick }: { onProfileClick: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();

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
          <span className="block text-xs text-ink-soft capitalize">
            {user?.role}
          </span>
        </span>
      </button>
    </aside>
  );
}
