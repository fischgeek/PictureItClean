import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(username, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-1">🧹 Picture It Clean</h1>
        <p className="text-sm text-gray-500 mb-6">Log in to your account</p>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded bg-brand-600 text-white py-2 hover:bg-brand-700 disabled:opacity-50"
        >
          Log in
        </button>
        <p className="text-sm text-gray-500 mt-4">
          No account yet? Ask your admin to create one for you.
        </p>
      </form>
    </div>
  );
}
