"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase credentials not configured.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        throw error;
      }

      // Mark this device as Admin / Owner device (for owner telemetry exclusion)
      try {
        localStorage.setItem("fsv_is_admin_device", "true");
        localStorage.setItem("fsv_exclude_owner", "true");
        localStorage.setItem("fsv_admin_logged_in", "true");
      } catch {}

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setErrorMsg(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-text-primary flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle luxury ambient glows */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-accent-gold/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent-gold/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-[#121212] border border-white/10 p-6 sm:p-10 shadow-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-full border border-accent-gold/40 bg-accent-gold/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-accent-gold" />
          </div>

          <span className="serif-heading text-2xl font-bold tracking-wider text-text-primary">
            FS <span className="text-accent-gold">VISUALS</span>
          </span>

          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-text-muted mt-1">
            Executive Admin Portal
          </span>
          <p className="text-xs text-text-muted mt-2">
            Sign in to access Invoices and Real-Time Visitor Telemetry.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Email / Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="the.fs.visualss@gmail.com"
                className="w-full bg-[#1b1b1b] border border-white/10 pl-10 pr-4 py-3 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors"
              />
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1b1b1b] border border-white/10 pl-10 pr-10 py-3 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent-gold text-bg-primary text-xs font-bold tracking-widest uppercase hover:bg-accent-warm transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/10 mt-6 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              "Sign In to Portal →"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-gold transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
