"use client";

import { useState, useEffect } from "react";
import {
  Inbox,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin,
  Clock,
  ExternalLink,
  MessageSquare,
  Phone,
  Calendar,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminInboxPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInquiries = async () => {
    setRefreshing(true);
    const supabase = createClient();

    if (!supabase) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setInquiries(data);
      }
    } catch (err) {
      console.error("Failed to load inquiries", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const toggleReadStatus = async (id, currentStatus) => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase
          .from("contact_inquiries")
          .update({ is_read: !currentStatus })
          .eq("id", id);
      }
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, is_read: !currentStatus } : inq))
      );
    } catch (err) {
      console.error("Failed to update read status", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.from("contact_inquiries").delete().eq("id", id);
      }
      setInquiries((prev) => prev.filter((inq) => inq.id !== id));
    } catch (err) {
      console.error("Failed to delete inquiry", err);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const formatTimeAgo = (iso) => {
    if (!iso) return "-";
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = inquiries.filter((inq) => !inq.is_read).length;

  return (
    <div className="min-h-screen bg-[#070707] text-text-primary flex flex-col font-sans p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <Inbox className="w-6 h-6 text-accent-gold" />
            <h1 className="text-xl sm:text-2xl font-bold serif-heading text-text-primary tracking-tight">
              Client Inquiries &amp; Direct Leads
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1 font-normal">
            Real-time inbox of wedding booking requests and consultations submitted from your portfolio.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInquiries}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b1b1b] border border-white/10 hover:border-accent-gold/40 text-text-primary text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent-gold" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Inquiries List */}
      <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            All Received Inquiries ({inquiries.length})
          </span>
          <span className="text-[11px] text-text-muted">
            Click WhatsApp or Email to connect directly with prospective clients
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
            <span>Loading inquiries...</span>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20 text-text-muted space-y-3">
            <Mail className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-sm font-medium">No inquiries received yet.</p>
            <p className="text-xs text-neutral-500">
              When clients submit your wedding contact form, their direct details will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {inquiries.map((inq) => {
              const cleanPhone = inq.phone ? inq.phone.replace(/[^0-9]/g, "") : "";
              const waUrl = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
                    inq.name
                  )},%20thank%20you%20for%20reaching%20out%20to%20FS%20Visuals!`
                : `https://wa.me/923273129464?text=Inquiry%20regarding%20client%20${encodeURIComponent(
                    inq.name
                  )}`;

              return (
                <div
                  key={inq.id}
                  className={`p-5 sm:p-6 transition-colors ${
                    !inq.is_read ? "bg-accent-gold/[0.03] border-l-4 border-l-accent-gold" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Client Details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="font-bold text-white text-base serif-heading">
                            {inq.name}
                          </span>
                        </div>

                        {!inq.is_read ? (
                          <span className="px-2 py-0.5 rounded-full bg-accent-gold/15 text-accent-gold border border-accent-gold/30 text-[10px] font-bold uppercase tracking-wider">
                            New Lead
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-text-muted text-[10px] font-medium">
                            Read
                          </span>
                        )}

                        <span className="text-[11px] text-text-muted font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{formatTimeAgo(inq.created_at)}</span>
                          <span>&bull;</span>
                          <span>{formatDateTime(inq.created_at)}</span>
                        </span>
                      </div>

                      {/* Contact Info Badges */}
                      <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted pt-1">
                        <a
                          href={`mailto:${inq.email}`}
                          className="flex items-center gap-1.5 text-accent-warm hover:text-white hover:underline transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>{inq.email}</span>
                        </a>

                        {inq.phone && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{inq.phone} (WhatsApp)</span>
                          </a>
                        )}

                        {inq.event_date && (
                          <span className="flex items-center gap-1.5 text-neutral-300">
                            <Calendar className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                            <span>Event: {inq.event_date}</span>
                          </span>
                        )}

                        {inq.city && inq.city !== "Unknown" && (
                          <span className="flex items-center gap-1.5 text-text-muted">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {inq.city}, {inq.country}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      {inq.message && (
                        <div className="p-4 rounded-xl bg-[#181818] border border-white/5 text-xs sm:text-sm text-slate-300 leading-relaxed mt-3">
                          <p className="whitespace-pre-wrap">{inq.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-start shrink-0 pt-1 flex-wrap">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>

                      <a
                        href={`mailto:${inq.email}?subject=FS%20Visuals%20Wedding%20Photography%20Consultation`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Reply Email</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => toggleReadStatus(inq.id, inq.is_read)}
                        className="px-3 py-1.5 rounded-xl bg-[#1b1b1b] border border-white/10 hover:border-white/20 text-xs text-text-muted hover:text-white transition-colors cursor-pointer"
                      >
                        {inq.is_read ? "Mark Unread" : "Mark Read"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(inq.id)}
                        className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Inquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
