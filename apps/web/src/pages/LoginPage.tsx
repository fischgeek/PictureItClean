import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";

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
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <form onSubmit={submit} className="card-glass p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <Logo size={28} />
          <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Picture It Clean</h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Log in to your account</p>
        <label className="label-glass">Username</label>
        <input className="input-glass mb-3" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        <label className="label-glass">Password</label>
        <input
          type="password"
          className="input-glass mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">
          Log in
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
          No account yet? Ask your admin to create one for you.
        </p>
      </form>
    </div>
  );
}
