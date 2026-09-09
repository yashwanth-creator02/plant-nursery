"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/Sidebar";
import { ProfilePanel } from "@/components/ProfilePanel";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);

  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLoginRoute) {
      router.replace("/login");
    }
    if (user && isLoginRoute) {
      router.replace("/invoice");
    }
  }, [user, loading, isLoginRoute, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="flex h-dvh items-center justify-center text-ink-soft text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar onProfileClick={() => setProfileOpen(true)} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  );
}
