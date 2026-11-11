import clsx from "clsx";
import {
  BarChart3,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanFace,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useServerWaking } from "../lib/api";
import { useAuth } from "../lib/auth";
import { initials } from "../lib/format";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <path d="M9 8h14M9 13h14M9 18h8" stroke="#F7F5F0" strokeWidth="2" strokeLinecap="round" opacity=".45" />
        <path
          d="m15.5 22 3 3 6-7"
          fill="none"
          stroke="#D9932B"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-display text-lg font-semibold leading-none tracking-tight">
        Smart<span className="text-brand">Attendance</span>
      </span>
    </span>
  );
}

export function WakeBanner() {
  const waking = useServerWaking();
  if (!waking) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-lg border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-ink shadow-raised"
    >
      <span className="relative mt-1 flex size-2.5 shrink-0" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
      </span>
      <p>
        <strong className="font-semibold">Waking up the server…</strong> The free demo sleeps when idle, so the first
        request can take up to a minute.
      </p>
    </div>
  );
}

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/check-in", label: "Face check-in", icon: ScanFace },
  { to: "/app/roster", label: "Roster", icon: ClipboardList },
  { to: "/app/students", label: "Students", icon: Users },
  { to: "/app/classes", label: "Classes", icon: GraduationCap },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
];

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <Link to="/app" onClick={onNavigate} className="px-5 py-5" aria-label="Smart Attendance overview">
        <Logo />
      </Link>
      <nav aria-label="Main" className="flex-1 px-3">
        <ul className="space-y-0.5">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  clsx(
                    "flex h-10 items-center gap-3 rounded px-3 text-sm font-medium transition-colors",
                    isActive ? "bg-brand text-white" : "text-muted hover:bg-sunken hover:text-ink",
                  )
                }
              >
                <Icon className="size-[18px]" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink"
            aria-hidden
          >
            {initials(user?.fullName ?? "")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.fullName}</p>
            <p className="truncate text-xs text-muted">@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="grid size-9 place-items-center rounded text-muted transition-colors hover:bg-sunken hover:text-absent"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the drawer after navigation
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-dvh lg:pl-64">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2 focus:shadow-raised"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">
        <SideNav />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Link to="/app" aria-label="Smart Attendance overview">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid size-10 place-items-center rounded text-ink hover:bg-sunken"
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-surface shadow-raised">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid size-9 place-items-center rounded text-muted hover:bg-sunken"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden />
            </button>
            <SideNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
