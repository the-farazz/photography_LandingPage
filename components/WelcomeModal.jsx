"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, X, User, CheckCircle2, Camera } from "lucide-react";

export default function WelcomeModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Never show on admin panel pages
    if (pathname?.startsWith("/admin")) return;

    // Check if user was already prompted or already provided name
    try {
      const alreadyPrompted = localStorage.getItem("fsv_welcome_prompted");
      const savedName = localStorage.getItem("fsv_visitor_name");

      if (!alreadyPrompted && !savedName) {
        // Delay 1.8s for a smooth, natural page load experience
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [pathname]);

  const handleDismiss = () => {
    try {
      localStorage.setItem("fsv_welcome_prompted", "true");
    } catch {}
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const cleanName = name.trim();

    try {
      let visitorId = localStorage.getItem("fsv_visitor_id");
      if (!visitorId) {
        visitorId = `fsv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("fsv_visitor_id", visitorId);
      }

      // Save locally
      localStorage.setItem("fsv_visitor_name", cleanName);
      localStorage.setItem("fsv_welcome_prompted", "true");
      localStorage.setItem("fsv_human_verified", "true");

      // Send to server API
      await fetch("/api/track/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          name: cleanName,
        }),
      });

      setSubmittedName(cleanName);
      setIsSuccess(true);

      // Auto close after 1.8 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 1800);
    } catch (err) {
      try {
        localStorage.setItem("fsv_welcome_prompted", "true");
      } catch {}
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#121212] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-white font-sans">
        {/* Ambient background gold glow inside modal */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="text-center py-4 space-y-3 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold serif-heading text-white">
              Nice to meet you, <span className="text-accent-gold">{submittedName}</span>!
            </h3>
            <p className="text-xs text-text-muted font-normal">
              Welcome to FS Visuals Cinematic Wedding Photography. Enjoy exploring our portfolio!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header with Camera Icon & Brand Greeting */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold shrink-0 shadow-lg">
                <Camera className="w-6 h-6" />
              </div>

              <div>
                <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-accent-gold">
                  <span>Welcome to FS Visuals</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold serif-heading text-white tracking-tight">
                  What should FS Visuals call you?
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Could you please share your name, Sir/Ma&apos;am?
            </p>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Your Name (e.g. Sarah & Hamza / Ali)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#181818] border border-white/10 text-white text-xs sm:text-sm placeholder:text-neutral-500 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-all"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  Skip
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-gold via-accent-warm to-accent-gold hover:opacity-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{submitting ? "Saving..." : "Continue"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
