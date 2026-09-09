"use client";

import { useEffect, useState } from "react";
import { X, LogOut, UserPlus, Trash2 } from "lucide-react";
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

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (open && isAdmin) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAdmin]);

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

  async function removeUser(id: string) {
    if (!confirm("Remove this user? They won't be able to log in anymore.")) {
      return;
    }
    setError("");
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove user");
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
            <div className="text-xs capitalize text-ink-soft">
              {user?.role}
            </div>
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
              {users?.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <div className="text-sm text-ink">{u.username}</div>
                    <div className="text-xs capitalize text-ink-soft">
                      {u.role}
                    </div>
                  </div>
                  {u.id !== user?.id && (
                    <button
                      onClick={() => removeUser(u.id)}
                      className="rounded p-1.5 text-ink-soft hover:bg-rust-tint hover:text-rust"
                      aria-label={`Remove ${u.username}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
