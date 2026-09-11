"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't sign in");
      await refresh();
      router.replace("/invoice");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center flex flex-col items-center">
          <svg className="mb-3 h-12 w-12" viewBox="0 0 256 256" fill="none">
            <circle cx="128" cy="128" r="116" fill="#0284c7" />
            <path d="M 0 196 Q 48 180, 96 190 T 192 188 T 256 196 L 256 256 L 0 256 Z" fill="#0369a1" opacity="0.6" />
            <ellipse cx="128" cy="180" rx="40" ry="14" fill="#3e2723" />
            <path d="M 128 178 C 126 150, 130 114, 128 88" stroke="#14532d" strokeWidth="6" strokeLinecap="round" />
            <path d="M 128 152 C 94 146, 68 122, 74 92 C 104 98, 126 118, 128 152 Z" fill="#4ade80" />
            <path d="M 128 134 C 162 126, 188 102, 182 72 C 152 80, 130 102, 128 134 Z" fill="#86efac" />
            <path d="M 128 88 C 117 68, 120 48, 128 34 C 136 48, 139 68, 128 88 Z" fill="#bbf7d0" />
          </svg>
          <div className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-pine-deep">
            Sri Vijaya Lakshmi Nursery
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Harige B. H. Road, Shimoga - 577203
          </p>
          <p className="text-xs text-ink-soft/80">
            Bill of Suppliers &amp; Stock Management
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-line bg-surface p-6 shadow-sm"
        >
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Username</span>
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-md border border-line-strong bg-surface px-3 py-2 text-sm outline-none focus:border-pine"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Password</span>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 pr-10 text-sm outline-none focus:border-pine"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 rounded text-ink-soft hover:text-ink focus:outline-none focus:ring-1 focus:ring-pine/30 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-md bg-rust-tint px-3 py-2 text-sm text-rust">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-pine px-3 py-2 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-ink-soft">
          Ask an admin if you need an account.
        </p>
      </div>
    </div>
  );
}
