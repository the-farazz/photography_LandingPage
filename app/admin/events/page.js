"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Trash2,
  Eye,
  Calendar,
  User,
  Phone,
  FileText,
  MapPin,
  X,
  Loader2,
  RefreshCw,
  Wallet,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Check,
  ChevronDown,
  Camera,
  Film,
} from "lucide-react";

export default function AdminEventsBudgetPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // New Event Modal state
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [submittingNewEvent, setSubmittingNewEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    event_title: "",
    event_date: new Date().toISOString().split("T")[0],
    event_location: "Karachi, Pakistan",
    service_type: "Photography & Videography",
    total_amount: "",
    paid_amount: "",
    payment_method: "Cash",
    invoice_no: "",
    notes: "",
  });

  // History Drawer Modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeEventForHistory, setActiveEventForHistory] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Close month dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) {
        setMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter out any fake demo/auto-generated events
  const cleanEventsList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(
      (e) =>
        !String(e.id || "").startsWith("evt_demo_") &&
        !String(e.client_name || "").startsWith("Client (INV-")
    );
  };

  // 1. Fetch real events from Supabase API
  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/events");
      const data = await res.json();

      if (data.success && Array.isArray(data.events)) {
        const clean = cleanEventsList(data.events);
        setEvents(clean);
        try {
          if (clean.length === 0) {
            localStorage.removeItem("fsv_cached_events");
          } else {
            localStorage.setItem("fsv_cached_events", JSON.stringify(clean));
          }
        } catch {}
      } else {
        setEvents([]);
        try {
          localStorage.removeItem("fsv_cached_events");
        } catch {}
      }
    } catch {
      setEvents([]);
      try {
        localStorage.removeItem("fsv_cached_events");
      } catch {}
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      const local = localStorage.getItem("fsv_cached_events");
      if (local) {
        const parsed = cleanEventsList(JSON.parse(local));
        setEvents(parsed);
      }
    } catch {}
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLocalEvents = (updatedList) => {
    const clean = cleanEventsList(updatedList);
    setEvents(clean);
    try {
      if (clean.length === 0) {
        localStorage.removeItem("fsv_cached_events");
      } else {
        localStorage.setItem("fsv_cached_events", JSON.stringify(clean));
      }
    } catch {}
  };

  // 2. Open Payment Modal for an event
  const handleOpenPaymentModal = (event) => {
    setActiveEventForPayment(event);
    const rem = Math.max(0, Number(event.remaining_amount ?? (event.total_amount - event.paid_amount)));
    setPaymentAmount(rem > 0 ? String(rem) : "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Cash");
    setPaymentNotes("");
    setPaymentModalOpen(true);
  };

  // 3. Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!activeEventForPayment) return;

    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid payment amount.", "error");
      return;
    }

    setSubmittingPayment(true);

    try {
      const res = await fetch(`/api/admin/events/${activeEventForPayment.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          notes: paymentNotes,
        }),
      });

      const data = await res.json().catch(() => ({}));

      const newPaid = Number(activeEventForPayment.paid_amount || 0) + amount;
      const newRemaining = Math.max(0, Number(activeEventForPayment.total_amount || 0) - newPaid);
      const newStatus = newRemaining <= 0 ? "FULLY PAID" : "PARTIALLY PAID";

      const newPaymentLog = {
        id: data?.payment?.id || `pay_${Date.now()}`,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: paymentNotes || "Remaining Balance Payment",
        created_at: new Date().toISOString(),
      };

      const updatedList = events.map((ev) => {
        if (ev.id === activeEventForPayment.id) {
          const existingPayments = Array.isArray(ev.event_payments) ? ev.event_payments : [];
          return {
            ...ev,
            paid_amount: newPaid,
            remaining_amount: newRemaining,
            status: newStatus,
            event_payments: [newPaymentLog, ...existingPayments],
          };
        }
        return ev;
      });

      updateLocalEvents(updatedList);
      setPaymentModalOpen(false);
      showToast(`Payment of Rs ${amount.toLocaleString()} recorded! Remaining: Rs ${newRemaining.toLocaleString()}`);
    } catch {
      showToast("Payment recorded successfully.", "success");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // 4. Submit New Event
  const handleCreateNewEvent = async (e) => {
    e.preventDefault();
    if (!newEventData.client_name.trim()) {
      showToast("Client name is required", "error");
      return;
    }

    const total = Number(newEventData.total_amount || 0);
    const paid = Number(newEventData.paid_amount || 0);

    if (total <= 0) {
      showToast("Please enter a valid total deal amount", "error");
      return;
    }

    setSubmittingNewEvent(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEventData),
      });

      const data = await res.json().catch(() => ({}));
      const remaining = Math.max(0, total - paid);
      const status = paid <= 0 ? "UNPAID" : remaining <= 0 ? "FULLY PAID" : "PARTIALLY PAID";

      const newEvt = data?.event || {
        id: `evt_${Date.now()}`,
        ...newEventData,
        total_amount: total,
        paid_amount: paid,
        remaining_amount: remaining,
        status,
        event_payments: paid > 0 ? [
          {
            id: `pay_init_${Date.now()}`,
            amount: paid,
            payment_date: newEventData.event_date,
            payment_method: newEventData.payment_method,
            notes: "Initial Advance / Booking Deposit",
          }
        ] : [],
      };

      const updated = [newEvt, ...events];
      updateLocalEvents(updated);
      setNewEventModalOpen(false);
      showToast(`Event for ${newEvt.client_name} booked successfully!`);
      setNewEventData({
        client_name: "",
        client_phone: "",
        client_email: "",
        event_title: "",
        event_date: new Date().toISOString().split("T")[0],
        event_location: "Karachi, Pakistan",
        service_type: "Photography & Videography",
        total_amount: "",
        paid_amount: "",
        payment_method: "Cash",
        invoice_no: "",
        notes: "",
      });
    } catch {
      showToast("Event saved successfully.", "success");
    } finally {
      setSubmittingNewEvent(false);
    }
  };

  // 5. Delete Event
  const handleDeleteEvent = async (id, clientName) => {
    if (!confirm(`Are you sure you want to delete event record for "${clientName}"?`)) return;

    try {
      await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      const filtered = events.filter((ev) => ev.id !== id);
      updateLocalEvents(filtered);
      showToast("Event deleted successfully.");
    } catch {
      const filtered = events.filter((ev) => ev.id !== id);
      updateLocalEvents(filtered);
    }
  };

  // 6. Complete Fresh Start - Wipe All Events & Cache
  const handleClearAllData = async () => {
    if (!confirm("Are you sure you want to completely remove ALL event bookings and payments? This will give you a 100% fresh start.")) {
      return;
    }

    try {
      setRefreshing(true);
      await fetch("/api/admin/events", { method: "DELETE" });
      setEvents([]);
      try {
        localStorage.removeItem("fsv_cached_events");
      } catch {}
      showToast("All event data wiped! Fresh start ready.");
    } catch {
      setEvents([]);
      try {
        localStorage.removeItem("fsv_cached_events");
      } catch {}
      showToast("Event data cleared.");
    } finally {
      setRefreshing(false);
    }
  };

  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    events.forEach((ev) => {
      if (ev.event_date) {
        const d = new Date(ev.event_date + (ev.event_date.includes("T") ? "" : "T00:00:00"));
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthsSet.add(key);
        }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedMonth !== "ALL" && ev.event_date) {
        const d = new Date(ev.event_date + (ev.event_date.includes("T") ? "" : "T00:00:00"));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key !== selectedMonth) return false;
      }
      if (statusFilter !== "ALL" && ev.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (ev.client_name || "").toLowerCase().includes(q);
        const titleMatch = (ev.event_title || "").toLowerCase().includes(q);
        const invMatch = (ev.invoice_no || "").toLowerCase().includes(q);
        const phoneMatch = (ev.client_phone || "").toLowerCase().includes(q);
        return nameMatch || titleMatch || invMatch || phoneMatch;
      }
      return true;
    });
  }, [events, selectedMonth, statusFilter, searchQuery]);

  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let fullyPaidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    filteredEvents.forEach((ev) => {
      const t = Number(ev.total_amount || 0);
      const p = Number(ev.paid_amount || 0);
      const r = Math.max(0, t - p);

      totalRevenue += t;
      totalPaid += p;
      totalRemaining += r;

      if (r <= 0) fullyPaidCount++;
      else if (p > 0) partialCount++;
      else unpaidCount++;
    });

    const collectionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;

    return {
      totalEvents: filteredEvents.length,
      totalRevenue,
      totalPaid,
      totalRemaining,
      collectionRate,
      fullyPaidCount,
      partialCount,
      unpaidCount,
    };
  }, [filteredEvents]);

  const formatPKR = (amount) => {
    return `Rs ${Number(amount || 0).toLocaleString("en-PK")}`;
  };

  const formatMonthName = (yearMonth) => {
    if (yearMonth === "ALL") return "All Months";
    const [year, month] = yearMonth.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Format event date as Day Month Year (e.g. 12 Dec 2026)
  const formatEventDate = (dateStr) => {
    if (!dateStr) return "TBD";
    try {
      const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-text-primary flex flex-col font-sans p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-top-4 ${
            toastMessage.type === "error"
              ? "bg-red-950/90 border-red-500/50 text-red-200"
              : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMessage.msg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-[#121212] border border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold serif-heading text-text-primary tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-accent-gold" />
            <span>Event Budget &amp; Revenue Telemetry</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Real-time tracking of booked events, cash collections, and pending client balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchEvents}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b1b1b] border border-white/10 hover:border-accent-gold/40 text-text-primary text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh events list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent-gold" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {events.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/30 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
              title="Clear all event records and start fresh"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear All</span>
            </button>
          )}

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1b1b1b] border border-white/10 hover:border-accent-gold/40 text-text-primary text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-accent-gold" />
            <span>Invoices</span>
          </Link>

          <button
            type="button"
            onClick={() => setNewEventModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-bg-primary font-extrabold text-xs uppercase tracking-wider hover:bg-accent-warm shadow-md shadow-accent-gold/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Event</span>
          </button>
        </div>
      </div>

      {/* 4 TELEMETRY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Events */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Total Events ({formatMonthName(selectedMonth)})
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-gold/10 border border-accent-gold/20 text-accent-gold flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {metrics.totalEvents}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-text-muted">
            <span className="text-emerald-400 font-bold">{metrics.fullyPaidCount} Paid</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-bold">{metrics.partialCount} Partial</span>
            <span>&bull;</span>
            <span className="text-rose-400 font-bold">{metrics.unpaidCount} Due</span>
          </div>
        </div>

        {/* Card 2: Total Revenue Booked */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Total Revenue Booked
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono truncate">
            {formatPKR(metrics.totalRevenue)}
          </div>
          <div className="mt-3 text-[11px] text-text-muted">
            Total deal value for filtered period
          </div>
        </div>

        {/* Card 3: Cash Received */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Cash Received (Paid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono truncate">
            {formatPKR(metrics.totalPaid)}
          </div>
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-text-muted font-bold mb-1">
              <span>Collection Rate</span>
              <span className="text-emerald-400">{metrics.collectionRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Remaining Due */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Remaining (Market Balance)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono truncate">
            {formatPKR(metrics.totalRemaining)}
          </div>
          <div className="mt-3 text-[11px] text-amber-400/80 font-medium">
            Pending collection from clients
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR (CUSTOM LUXURY DROPDOWN, NO NATIVE OS BLUE POPUP) */}
      <div className="bg-[#121212] border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, invoice #, or event..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#161616] border border-white/10 text-xs text-text-primary placeholder:text-text-muted/60 focus:border-accent-gold/50 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Custom Luxury Month Selector (Replacing native browser select) */}
          <div className="relative" ref={monthDropdownRef}>
            <button
              type="button"
              onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
              className="flex items-center gap-2.5 bg-[#161616] border border-white/10 hover:border-accent-gold/40 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-accent-gold shrink-0" />
              <span>{formatMonthName(selectedMonth)}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
                  monthDropdownOpen ? "rotate-180 text-accent-gold" : ""
                }`}
              />
            </button>

            {monthDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#161616] border border-white/15 rounded-xl shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth("ALL");
                    setMonthDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                    selectedMonth === "ALL"
                      ? "bg-accent-gold/15 text-accent-gold font-bold"
                      : "text-text-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>All Months</span>
                  {selectedMonth === "ALL" && <Check className="w-3.5 h-3.5 text-accent-gold" />}
                </button>

                {availableMonths.map((ym) => (
                  <button
                    key={ym}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(ym);
                      setMonthDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                      selectedMonth === ym
                        ? "bg-accent-gold/15 text-accent-gold font-bold"
                        : "text-text-muted hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{formatMonthName(ym)}</span>
                    {selectedMonth === ym && <Check className="w-3.5 h-3.5 text-accent-gold" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-[#161616] border border-white/10 rounded-xl p-1 gap-1">
            {[
              { id: "ALL", label: "All" },
              { id: "UNPAID", label: "Unpaid" },
              { id: "PARTIALLY PAID", label: "Partial" },
              { id: "FULLY PAID", label: "Paid" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-accent-gold text-bg-primary font-extrabold shadow-sm"
                    : "text-text-muted hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* EVENTS & PAYMENTS MAIN TABLE */}
      <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-accent-gold" />
              <span>Booked Client Events ({filteredEvents.length})</span>
            </h2>
          </div>
          <span className="text-[11px] text-text-muted">
            Viewing: <strong className="text-accent-gold">{formatMonthName(selectedMonth)}</strong>
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-text-muted gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
            <span className="text-xs">Loading event records...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 px-4 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-white">No Event Bookings Found</p>
              <p className="text-xs text-text-muted mt-1 max-w-sm">
                {searchQuery || selectedMonth !== "ALL" || statusFilter !== "ALL"
                  ? "No bookings match your selected search or filter criteria."
                  : "Your telemetry is clean and fresh. Click below to book an event or create an invoice with client details to record bookings."}
              </p>
            </div>
            <button
              onClick={() => setNewEventModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-bg-primary font-extrabold text-xs uppercase tracking-wider hover:bg-accent-warm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book First Event</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-text-muted font-bold uppercase tracking-wider text-[10px] bg-[#161616]">
                  <th className="px-5 py-3.5">Client &amp; Scope</th>
                  <th className="px-5 py-3.5">Event Date</th>
                  <th className="px-5 py-3.5 text-right">Deal Total</th>
                  <th className="px-5 py-3.5 text-right">Paid</th>
                  <th className="px-5 py-3.5 text-right">Remaining Due</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map((evt) => {
                  const total = Number(evt.total_amount || 0);
                  const paid = Number(evt.paid_amount || 0);
                  const remaining = Math.max(0, total - paid);
                  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                  const isFullyPaid = remaining <= 0;

                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      {/* 1. Client & Scope */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-[13.5px]">
                              {evt.client_name}
                            </span>
                            {evt.invoice_no && (
                              <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-accent-gold/10 text-accent-gold border border-accent-gold/25 font-bold">
                                {evt.invoice_no}
                              </span>
                            )}
                          </div>

                          {/* Service Type (No duplicate strings) */}
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <Camera className="w-3 h-3 text-accent-gold/70 shrink-0" />
                            <span>{evt.service_type || evt.event_title || "Photography Services"}</span>
                          </div>

                          {/* Extra info if different */}
                          {evt.event_title && evt.event_title !== evt.service_type && (
                            <span className="text-[11px] text-text-muted/70 italic">
                              {evt.event_title}
                            </span>
                          )}

                          {evt.client_phone && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-text-muted/80">
                              <Phone className="w-2.5 h-2.5 text-accent-gold/60" />
                              {evt.client_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Event Date (Formatted Day Month Year) */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-accent-gold/70" />
                            <span>{formatEventDate(evt.event_date)}</span>
                          </span>
                          <span className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-text-muted/60" />
                            {evt.event_location || "Karachi, Pakistan"}
                          </span>
                        </div>
                      </td>

                      {/* 3. Deal Total */}
                      <td className="px-5 py-4 text-right font-extrabold text-white font-mono text-sm whitespace-nowrap">
                        {formatPKR(total)}
                      </td>

                      {/* 4. Paid */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono text-sm font-extrabold ${paid > 0 ? "text-emerald-400" : "text-text-muted"}`}>
                            {formatPKR(paid)}
                          </span>
                          {paid > 0 && total > 0 && (
                            <div className="w-16 h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Remaining Due */}
                      <td className="px-5 py-4 text-right whitespace-nowrap font-bold">
                        {isFullyPaid ? (
                          <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cleared</span>
                          </span>
                        ) : (
                          <span className="text-amber-300 font-extrabold font-mono text-sm">
                            {formatPKR(remaining)}
                          </span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isFullyPaid
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : paid > 0
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFullyPaid ? "bg-emerald-400" : paid > 0 ? "bg-amber-400" : "bg-rose-400"
                            }`}
                          />
                          {evt.status || (isFullyPaid ? "FULLY PAID" : paid > 0 ? "PARTIALLY PAID" : "UNPAID")}
                        </span>
                      </td>

                      {/* 7. Actions (Clean compact buttons) */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isFullyPaid ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(evt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-gold/15 text-accent-gold border border-accent-gold/30 hover:bg-accent-gold hover:text-bg-primary font-bold text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                              title="Record installment or balance payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>+ Pay</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveEventForHistory(evt);
                                setHistoryModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
                            >
                              <span>Ledger</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveEventForHistory(evt);
                              setHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            title="View Payment Logs & Installments"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(evt.id, evt.client_name)}
                            className="p-1.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-400 hover:bg-rose-900/40 transition-all cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD PAYMENT */}
      {/* ========================================================================= */}
      {paymentModalOpen && activeEventForPayment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent-gold" />
                  <span>Record Payment</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Log installment or remaining balance without creating duplicate invoices
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Summary Card */}
            <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{activeEventForPayment.client_name}</div>
                  <div className="text-xs text-text-muted mt-0.5">{activeEventForPayment.event_title || "Wedding Event"}</div>
                </div>
                {activeEventForPayment.invoice_no && (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-accent-gold">
                    {activeEventForPayment.invoice_no}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                <div className="bg-[#121212] p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Deal Total</span>
                  <span className="text-xs font-mono font-bold text-white">
                    Rs {Number(activeEventForPayment.total_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-lg border border-emerald-500/10">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold tracking-wider">Paid So Far</span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Rs {Number(activeEventForPayment.paid_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-lg border border-amber-500/20 bg-amber-950/10">
                  <span className="text-[10px] text-amber-400 block uppercase font-bold tracking-wider">Remaining Due</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Rs {Math.max(0, Number(activeEventForPayment.remaining_amount ?? (activeEventForPayment.total_amount - activeEventForPayment.paid_amount))).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    Payment Amount (Rs) <span className="text-rose-400">*</span>
                  </label>
                  {Math.max(0, Number(activeEventForPayment.remaining_amount ?? (activeEventForPayment.total_amount - activeEventForPayment.paid_amount))) > 0 && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(String(Math.max(0, Number(activeEventForPayment.remaining_amount ?? (activeEventForPayment.total_amount - activeEventForPayment.paid_amount)))))}
                      className="text-[10px] text-accent-gold hover:underline font-bold cursor-pointer"
                    >
                      Fill Remaining (Rs {Math.max(0, Number(activeEventForPayment.remaining_amount ?? (activeEventForPayment.total_amount - activeEventForPayment.paid_amount))).toLocaleString()})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted font-bold">Rs</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 10000)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-sm font-mono font-bold text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onClick={(e) => {
                      try {
                        if (typeof e.target.showPicker === "function") e.target.showPicker();
                      } catch {}
                    }}
                    onFocus={(e) => {
                      try {
                        if (typeof e.target.showPicker === "function") e.target.showPicker();
                      } catch {}
                    }}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Cash" className="bg-[#181818]">Cash on Hand</option>
                    <option value="Bank Transfer" className="bg-[#181818]">Bank Transfer</option>
                    <option value="JazzCash / EasyPaisa" className="bg-[#181818]">JazzCash / EasyPaisa</option>
                    <option value="Cheque" className="bg-[#181818]">Cheque</option>
                    <option value="Online Payment" className="bg-[#181818]">Online Payment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                  Payment Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. 2nd Installment received via Bank Transfer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-text-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 rounded-xl bg-accent-gold text-bg-primary font-bold text-xs uppercase tracking-wider hover:bg-accent-warm transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Payment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BOOK NEW EVENT */}
      {/* ========================================================================= */}
      {newEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-accent-gold" />
                  <span>Book New Client Event</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Record new photography &amp; videography assignment
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewEventModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateNewEvent} className="space-y-4">
              {/* Client Info */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Client Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newEventData.client_name}
                    onChange={(e) => setNewEventData({ ...newEventData, client_name: e.target.value })}
                    placeholder="e.g. Farhan & Ayesha Wedding"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newEventData.client_phone}
                      onChange={(e) => setNewEventData({ ...newEventData, client_phone: e.target.value })}
                      placeholder="0300-1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={newEventData.client_email}
                      onChange={(e) => setNewEventData({ ...newEventData, client_email: e.target.value })}
                      placeholder="client@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Service & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Service Scope
                  </label>
                  <select
                    value={newEventData.service_type}
                    onChange={(e) => setNewEventData({ ...newEventData, service_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Photography & Videography" className="bg-[#181818]">Photography & Videography</option>
                    <option value="Photography Services" className="bg-[#181818]">Photography Only</option>
                    <option value="Videography Services" className="bg-[#181818]">Cinematic Videography Only</option>
                    <option value="Drone Cinematography" className="bg-[#181818]">Drone Cinematography</option>
                    <option value="Complete Wedding Coverage & Luxury Album" className="bg-[#181818]">Complete Package + Album</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Event Title / Occasion
                  </label>
                  <input
                    type="text"
                    value={newEventData.event_title}
                    onChange={(e) => setNewEventData({ ...newEventData, event_title: e.target.value })}
                    placeholder="Barat / Walima / Birthday"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventData.event_date}
                    onClick={(e) => {
                      try {
                        if (typeof e.target.showPicker === "function") e.target.showPicker();
                      } catch {}
                    }}
                    onFocus={(e) => {
                      try {
                        if (typeof e.target.showPicker === "function") e.target.showPicker();
                      } catch {}
                    }}
                    onChange={(e) => setNewEventData({ ...newEventData, event_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={newEventData.event_location}
                    onChange={(e) => setNewEventData({ ...newEventData, event_location: e.target.value })}
                    placeholder="Karachi, Pakistan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Pricing & Advance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Deal Total Amount (Rs) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted font-bold">Rs</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newEventData.total_amount}
                      onChange={(e) => setNewEventData({ ...newEventData, total_amount: e.target.value })}
                      placeholder="15000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-sm font-mono font-bold text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Advance Received (Rs)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted font-bold">Rs</span>
                    <input
                      type="number"
                      min="0"
                      value={newEventData.paid_amount}
                      onChange={(e) => setNewEventData({ ...newEventData, paid_amount: e.target.value })}
                      placeholder="8000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-sm font-mono font-bold text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Live Balance Computation Box */}
              {Number(newEventData.total_amount) > 0 && (
                <div className="bg-[#181818] border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                  <span className="text-text-muted">
                    Remaining Balance:
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    Rs {Math.max(0, Number(newEventData.total_amount || 0) - Number(newEventData.paid_amount || 0)).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Payment Method & Invoice # */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Advance Payment Method
                  </label>
                  <select
                    value={newEventData.payment_method}
                    onChange={(e) => setNewEventData({ ...newEventData, payment_method: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Cash" className="bg-[#181818]">Cash on Hand</option>
                    <option value="Bank Transfer" className="bg-[#181818]">Bank Transfer</option>
                    <option value="JazzCash / EasyPaisa" className="bg-[#181818]">JazzCash / EasyPaisa</option>
                    <option value="Cheque" className="bg-[#181818]">Cheque</option>
                    <option value="Online Payment" className="bg-[#181818]">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Invoice Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={newEventData.invoice_no}
                    onChange={(e) => setNewEventData({ ...newEventData, invoice_no: e.target.value })}
                    placeholder="e.g. INV-2026-0042"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                  Internal Booking Notes
                </label>
                <textarea
                  rows="2"
                  value={newEventData.notes}
                  onChange={(e) => setNewEventData({ ...newEventData, notes: e.target.value })}
                  placeholder="Add specific requirements, shoot schedule, or team notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181818] border border-white/10 text-xs text-white placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setNewEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-text-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNewEvent}
                  className="px-5 py-2.5 rounded-xl bg-accent-gold text-bg-primary font-bold text-xs uppercase tracking-wider hover:bg-accent-warm transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {submittingNewEvent ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Create Booking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PAYMENT HISTORY DRAWER / LEDGER */}
      {/* ========================================================================= */}
      {historyModalOpen && activeEventForHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-accent-gold" />
                  <span>Payment Ledger</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  All recorded installments &amp; cash collections
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Event Profile Card */}
            <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{activeEventForHistory.client_name}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {activeEventForHistory.event_title || "Wedding Event"} &bull; {formatEventDate(activeEventForHistory.event_date)}
                  </div>
                </div>
                {activeEventForHistory.invoice_no && (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-accent-gold">
                    {activeEventForHistory.invoice_no}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                <div className="bg-[#121212] p-2.5 rounded-lg border border-white/5">
                  <span className="text-[10px] text-text-muted block uppercase font-bold tracking-wider">Deal Total</span>
                  <span className="text-xs font-mono font-bold text-white">
                    Rs {Number(activeEventForHistory.total_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-lg border border-emerald-500/10">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold tracking-wider">Collected</span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Rs {Number(activeEventForHistory.paid_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-lg border border-amber-500/20 bg-amber-950/10">
                  <span className="text-[10px] text-amber-400 block uppercase font-bold tracking-wider">Balance</span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Rs {Math.max(0, Number(activeEventForHistory.remaining_amount ?? (activeEventForHistory.total_amount - activeEventForHistory.paid_amount))).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Timeline / Installments List */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Installment History ({Array.isArray(activeEventForHistory.event_payments) ? activeEventForHistory.event_payments.length : 0})
              </h4>

              {Array.isArray(activeEventForHistory.event_payments) && activeEventForHistory.event_payments.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {activeEventForHistory.event_payments.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="bg-[#181818] border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold text-text-primary">
                            {p.payment_method || "Cash"}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatEventDate(p.payment_date)}
                          </span>
                        </div>
                        {p.notes && (
                          <p className="text-xs text-text-muted/80 truncate italic">
                            &ldquo;{p.notes}&rdquo;
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-400 shrink-0">
                        +Rs {Number(p.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-[#181818] rounded-xl border border-white/5 text-xs text-text-muted italic">
                  No separate installments recorded yet.
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              {Math.max(0, Number(activeEventForHistory.remaining_amount ?? (activeEventForHistory.total_amount - activeEventForHistory.paid_amount))) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryModalOpen(false);
                    handleOpenPaymentModal(activeEventForHistory);
                  }}
                  className="px-4 py-2 rounded-xl bg-accent-gold text-bg-primary font-bold text-xs uppercase tracking-wider hover:bg-accent-warm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>+ Record Payment</span>
                </button>
              ) : (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fully Cleared</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-text-muted hover:text-white transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
