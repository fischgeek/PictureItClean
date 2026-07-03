import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { api, UserRole } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Layout } from "../components/Layout";

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: api.listUsers });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  const createUser = useMutation({
    mutationFn: () => api.createUser(username.trim(), password, displayName.trim() || username.trim(), role),
    onSuccess: () => {
      setDisplayName("");
      setUsername("");
      setPassword("");
      setRole("user");
      setError(null);
      invalidate();
    },
    onError: (e: any) => setError(e.message || "Failed to create user"),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => api.updateUserRole(id, role),
    onSuccess: invalidate,
    onError: (e: any) => alert(e.message || "Failed to update role"),
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => api.resetUserPassword(id, password),
    onError: (e: any) => alert(e.message || "Failed to reset password"),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: invalidate,
    onError: (e: any) => alert(e.message || "Failed to delete user"),
  });

  return (
    <Layout>
      <h1 className="text-2xl font-semibold tracking-tight mb-4 text-slate-800 dark:text-slate-100">User Accounts</h1>

      <div className="card-glass p-4 mb-6">
        <h2 className="text-lg font-medium mb-3 text-slate-700 dark:text-slate-200">Add a user</h2>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (username.trim() && password) createUser.mutate();
          }}
        >
          <div>
            <label className="label-glass">Display name</label>
            <input className="input-glass" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="label-glass">Username</label>
            <input className="input-glass" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="label-glass">Password</label>
            <input type="password" className="input-glass" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label-glass">Role</label>
            <select className="input-glass" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            {error && <p className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</p>}
            <button disabled={createUser.isPending} className="btn-primary">
              Add user
            </button>
          </div>
        </form>
      </div>

      {isLoading && <p className="text-slate-500 dark:text-slate-400">Loading…</p>}

      <ul className="space-y-2">
        {users?.map((u) => (
          <li key={u.id} className="card-glass p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {u.displayName}
                {u.id === me?.id && <span className="text-slate-400 dark:text-slate-500 text-sm"> (you)</span>}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                @{u.username} · <span className="uppercase tracking-wide">{u.role}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn-ghost text-sm"
                onClick={() => updateRole.mutate({ id: u.id, role: u.role === "admin" ? "user" : "admin" })}
              >
                {u.role === "admin" ? "Demote to User" : "Promote to Admin"}
              </button>
              <button
                className="btn-ghost text-sm"
                onClick={() => {
                  const next = prompt(`New password for ${u.username} (min 6 characters):`);
                  if (next) resetPassword.mutate({ id: u.id, password: next });
                }}
              >
                Reset password
              </button>
              <button
                className="btn-danger text-sm"
                onClick={() => {
                  if (confirm(`Delete user "${u.username}"? This cannot be undone.`)) deleteUser.mutate(u.id);
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Layout>
  );
}
