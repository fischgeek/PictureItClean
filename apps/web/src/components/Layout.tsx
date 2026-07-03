import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AssignmentsIcon, BuildingIcon, LogoutIcon, UsersIcon } from "./icons";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border-b border-white/50 dark:border-white/10">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            <Logo size={30} />
            <span className="hidden sm:inline">Picture It Clean</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user && (
              <>
                <Link
                  to="/locations"
                  title="Locations"
                  aria-label="Locations"
                  className={`icon-btn ${location.pathname === "/locations" ? "icon-btn-active" : ""}`}
                >
                  <BuildingIcon />
                </Link>
                {user.role === "admin" && (
                  <>
                    <Link
                      to="/admin/assignments"
                      title="Assignments"
                      aria-label="Assignments"
                      className={`icon-btn ${location.pathname === "/admin/assignments" ? "icon-btn-active" : ""}`}
                    >
                      <AssignmentsIcon />
                    </Link>
                    <Link
                      to="/admin/users"
                      title="Users"
                      aria-label="Users"
                      className={`icon-btn ${location.pathname === "/admin/users" ? "icon-btn-active" : ""}`}
                    >
                      <UsersIcon />
                    </Link>
                  </>
                )}
                <span
                  title={user.displayName}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-accent-500 text-white text-xs font-semibold select-none"
                >
                  {initials(user.displayName)}
                </span>
                <button
                  title="Log out"
                  aria-label="Log out"
                  className="icon-btn"
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                >
                  <LogoutIcon />
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
