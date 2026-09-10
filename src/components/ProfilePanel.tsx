"use client";

import { useEffect, useState } from "react";
import { X, LogOut, UserPlus, Trash2, Sun, Moon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type ManagedUser = {
  id: string;
  username: string;
  role: "admin" | "staff";
  createdAt: string;
};

export function ProfilePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (open) {
      setIsDark(document.documentElement.classList.contains("dark"));
      if (isAdmin) {
        loadUsers();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAdmin]);

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

  async function loadUsers() {
    setLoadingUsers(true);
    setError("");
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewUsername("");
      setNewPassword("");
      setNewRole("staff");
      loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add user");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRole(id: string, role: "admin" | "staff") {
    setError("");
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't update role");
      loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update role");
    }
  }

  async function removeUser(targetUser: ManagedUser) {
    const isAdminTarget = targetUser.role === "admin";
    const msg = isAdminTarget
      ? `Remove admin "${targetUser.username}"? They will lose all admin and account access.`
      : `Remove user "${targetUser.username}"? They won't be able to log in anymore.`;

    if (!confirm(msg)) {
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't remove user");
      loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove user");
    }
  }

  async function handleClearAllData() {
    const confirmed = window.confirm(
      "WARNING: This will permanently delete all invoices, line items, stock items, and other user accounts from the database.\n\nThis action CANNOT be undone.\n\nAre you sure you want to proceed?",
    );
    if (!confirmed) return;

    setClearing(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clear-data", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear database");
      alert("Database has been completely cleared.");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't clear database");
      setClearing(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-ink/20"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto border-l border-line bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-base font-semibold text-ink">
            Account
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-line/60 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine text-base font-semibold text-surface">
            {user?.username?.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">
              {user?.username}
            </div>
            <div className="text-xs capitalize text-ink-soft">{user?.role}</div>
          </div>
        </div>

        <div className="border-b border-line px-5 py-3">
          <div className="mb-1.5 text-xs font-medium text-ink-soft">Theme</div>
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
        </div>

        <div className="px-5 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-line-strong px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-line/50"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>

        {isAdmin && (
          <div className="flex-1 border-t border-line px-5 py-4">
            <h3 className="mb-3 font-serif text-sm font-semibold text-ink">
              Manage users
            </h3>

            {error && (
              <p className="mb-3 rounded-md bg-rust-tint px-3 py-2 text-xs text-rust">
                {error}
              </p>
            )}

            <form onSubmit={addUser} className="mb-5 flex flex-col gap-2">
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Username"
                required
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
              />
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Temporary password"
                type="text"
                required
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
              />
              <select
                value={newRole}
                onChange={(e) =>
                  setNewRole(e.target.value as "admin" | "staff")
                }
                className="rounded-md border border-line-strong bg-surface px-3 py-1.5 text-sm outline-none focus:border-pine"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-md bg-pine px-3 py-1.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <UserPlus size={15} /> Add user
              </button>
            </form>

            <ul className="flex flex-col divide-y divide-line">
              {loadingUsers && (
                <li className="py-2 text-xs text-ink-soft">Loading…</li>
              )}
              {users?.map((u) => {
                const isCurrent = u.id === user?.id;
                return (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {u.username}
                      </div>
                      <div className="text-xs text-ink-soft">
                        Joined{" "}
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <span className="rounded bg-pine-tint px-2 py-1 text-xs font-medium capitalize text-pine-deep">
                          Admin (You)
                        </span>
                      ) : (
                        <>
                          <select
                            value={u.role}
                            onChange={(e) =>
                              updateRole(
                                u.id,
                                e.target.value as "admin" | "staff",
                              )
                            }
                            className="rounded border border-line-strong bg-surface px-2 py-1 text-xs font-medium capitalize text-ink outline-none transition-colors focus:border-pine"
                            aria-label={`Change role for ${u.username}`}
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => removeUser(u)}
                            className="rounded p-1 text-ink-soft transition-colors hover:bg-rust-tint hover:text-rust"
                            title={`Remove ${u.role === "admin" ? "admin" : "user"} ${u.username}`}
                            aria-label={`Remove ${u.username}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 border-t border-line pt-5">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-rust">
                Danger Zone
              </h4>
              <p className="mb-3 text-xs text-ink-soft">
                Permanently delete all invoices, stock items, and reset database
                records. Your admin account will remain active.
              </p>
              <button
                type="button"
                onClick={handleClearAllData}
                disabled={clearing}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-rust/40 bg-rust-tint/60 px-3 py-2 text-xs font-semibold text-rust transition-colors hover:bg-rust hover:text-surface disabled:opacity-50"
              >
                <Trash2 size={14} />
                {clearing ? "Clearing database…" : "Clear all database data"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
