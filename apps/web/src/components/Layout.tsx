import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="bg-brand-700 text-white">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold">
            🧹 Picture It Clean
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span>{user.displayName}</span>
              <button
                className="rounded bg-brand-600 px-3 py-1 hover:bg-brand-500"
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
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
