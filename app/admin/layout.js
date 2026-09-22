"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Activity,
  Inbox,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Radio,
  Sliders,
  Camera,
  Layers,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("the.fs.visualss@gmail.com");
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // If login page, render standalone without sidebar
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // If on login page, skip protection
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    try {
      // Mark as admin device
      localStorage.setItem("fsv_is_admin_device", "true");
      if (localStorage.getItem("fsv_exclude_owner") === null) {
        localStorage.setItem("fsv_exclude_owner", "true");
      }

      const isLogged = localStorage.getItem("fsv_admin_logged_in") === "true";
      if (!isLogged) {
        router.push("/admin/login");
        setAuthChecked(true);
        return;
      }

      setIsAuthenticated(true);
    } catch {}

    const supabase = createClient();
    if (supabase) {
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (data?.user?.email) {
            setUserEmail(data.user.email);
          }
        })
        .catch(() => {});
    }

    setAuthChecked(true);
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem("fsv_admin_logged_in");
    } catch {}
    setIsAuthenticated(false);
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070707] flex items-center justify-center text-text-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
      </div>
    );
  }

  const navItems = [
    {
      label: "Invoice Generator",
      href: "/admin",
      icon: FileText,
      badge: "Tool",
      isActive: pathname === "/admin",
    },
    {
      label: "Client Inquiries",
      href: "/admin/inbox",
      icon: Inbox,
      badge: "Leads",
      isActive: pathname === "/admin/inbox",
    },
    {
      label: "Visitor Telemetry",
      href: "/admin/analytics",
      icon: Activity,
      badge: "Real-Time",
      isActive: pathname === "/admin/analytics",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070707] text-text-primary flex font-sans">
      {/* ========================================================================= */}
      {/* DESKTOP FIXED SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-[#0d0d0d] border-r border-white/10 z-40 shadow-2xl">
        {/* Brand Header */}
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="serif-heading text-lg font-bold tracking-wider text-text-primary block leading-none">
                FS <span className="text-accent-gold">VISUALS</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-accent-warm block mt-1">
                Executive Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted">
            Management Suite
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 rounded-md text-xs font-bold tracking-wider transition-all uppercase ${
                  item.isActive
                    ? "bg-accent-gold text-bg-primary shadow-md shadow-accent-gold/10 font-extrabold"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.isActive ? "text-bg-primary" : "text-accent-gold"}`} />
                  <span>{item.label}</span>
                </div>

              </Link>
            );
          })}

          {/* Quick Website View */}
          <div className="pt-6">
            <div className="px-3 py-2 text-[10px] font-bold tracking-[0.2em] uppercase text-text-muted">
              Live Channels
            </div>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-semibold text-text-muted hover:text-accent-gold hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-accent-gold" />
                <span>Visit Main Website</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            </Link>
          </div>
        </div>

        {/* User Profile & Logout Bottom Box */}
        <div className="p-4 border-t border-white/10 bg-[#0a0a0a]">
          <div className="flex items-center justify-between gap-2 p-2 rounded bg-white/[0.03] border border-white/5 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-text-primary truncate block">
                  Admin User
                </span>
                <span className="text-[10px] text-text-muted font-mono truncate block">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE SLIDE-OUT DRAWER */}
      {/* ========================================================================= */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-[#0e0e0e] border-r border-white/10 h-full p-5 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <Link
                href="/admin"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="serif-heading text-base font-bold text-text-primary">
                  FS <span className="text-accent-gold">VISUALS</span>
                </span>
              </Link>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded bg-white/5 text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                      item.isActive
                        ? "bg-accent-gold text-bg-primary font-extrabold"
                        : "text-text-muted hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-black/20">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <Link
                href="/"
                target="_blank"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 px-3.5 py-3 rounded text-xs font-medium text-text-muted hover:text-accent-gold hover:bg-white/5"
              >
                <ExternalLink className="w-4 h-4 text-accent-gold" />
                <span>Visit Main Website</span>
              </Link>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#111111] border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="p-2 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="serif-heading text-base font-bold text-text-primary">
              FS <span className="text-accent-gold">VISUALS</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={pathname === "/admin" ? "/admin/analytics" : "/admin"}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] font-bold uppercase text-accent-gold"
            >
              {pathname === "/admin" ? "Analytics →" : "Invoices →"}
            </Link>
          </div>
        </header>

        {/* Children View Content */}
        <div className="flex-1 w-full min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
