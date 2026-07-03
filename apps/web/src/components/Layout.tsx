import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border-b border-white/50 dark:border-white/10">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            <Logo size={30} />
            Picture It Clean
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-2 text-sm">
                {user.role === "admin" && (
                  <Link to="/admin/users" className="btn-ghost">
                    Users
                  </Link>
                )}
                <span className="hidden sm:inline text-slate-600 dark:text-slate-300">{user.displayName}</span>
                <button
                  className="btn-ghost"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
