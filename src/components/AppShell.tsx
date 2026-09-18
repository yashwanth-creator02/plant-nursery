// src/components/AppShell.tsx

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LanguageProvider, useLanguage } from "@/lib/language-context";
import { Sidebar } from "@/components/Sidebar";
import { ProfilePanel } from "@/components/ProfilePanel";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Normalize pathname by stripping locale prefix (e.g. /en/login -> /login, /kn/login -> /login)
  const normalizedPathname = pathname.replace(/^\/(?:en|kn)(?:\/|$)/, "/") || "/";
  const isLoginRoute = normalizedPathname === "/login" || pathname === "/login" || pathname.endsWith("/login");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("svl_sidebar_collapsed");
      if (saved === "true") setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("svl_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Ctrl+B / Cmd+B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginRoute) {
      router.replace(`/${language}/login`);
    }
    if (user && isLoginRoute) {
      router.replace(`/${language}/invoice`);
    }
  }, [user, loading, isLoginRoute, router, language]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center text-ink-soft text-sm">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      {/* Mobile top bar with hamburger menu on left, brand in center, switch toggle & profile icon on right */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-paper-flat px-3 sm:px-4 md:hidden gap-2">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line-strong bg-surface text-ink transition-colors hover:bg-line/50"
          aria-label="Open navigation menu"
        >
          <Menu size={19} />
        </button>

        <span className="font-serif text-sm sm:text-base font-semibold tracking-tight text-pine-deep truncate min-w-0">
          {t("brandFullName")}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-pine text-sm font-semibold text-surface shadow-sm transition-transform active:scale-95 cursor-pointer"
            aria-label="Open account profile"
          >
            {user?.username?.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onProfileClick={() => {
          setMobileMenuOpen(false);
          setProfileOpen(true);
        }}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ShellInner>{children}</ShellInner>
      </LanguageProvider>
    </AuthProvider>
  );
}
