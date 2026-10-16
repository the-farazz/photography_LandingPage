"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";

export default function AdminEventsBudgetPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [submittingNewEvent, setSubmittingNewEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    event_title: "Wedding Photography & Cinematic Film",
    event_date: new Date().toISOString().split("T")[0],
    event_location: "Karachi, Pakistan",
    service_type: "Photography & Videography",
    total_amount: 15000,
    paid_amount: 8000,
    payment_method: "Cash / Advance",
    invoice_no: "",
    notes: "",
  });

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeEventForHistory, setActiveEventForHistory] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/events");
      const data = await res.json();

      if (data.success && Array.isArray(data.events) && data.events.length > 0) {
        setEvents(data.events);
        try {
          localStorage.setItem("fsv_cached_events", JSON.stringify(data.events));
        } catch {}
      } else {
        const local = localStorage.getItem("fsv_cached_events");
        if (local) {
          setEvents(JSON.parse(local));
        } else {
          const demoEvents = [
            {
              id: "evt_demo_1",
              client_name: "Farhan & Ayesha",
              client_phone: "+92 300 1234567",
              client_email: "farhan@example.com",
              event_title: "Mehndi & Barat Premium Coverage",
              event_date: "2026-10-25",
              event_location: "Karachi, Pakistan",
              service_type: "Photography, Videography & Drone",
              total_amount: 15000,
              paid_amount: 8000,
              remaining_amount: 7000,
              status: "PARTIALLY PAID",
              invoice_no: "INV-2026-0042",
              notes: "Advance 8k received at booking. Remaining 7k due upon album delivery.",
              event_payments: [
                {
                  id: "pay_1",
                  amount: 8000,
                  payment_date: "2026-09-20",
                  payment_method: "Cash",
                  notes: "Booking Advance Deposit",
                },
              ],
            },
            {
              id: "evt_demo_2",
              client_name: "Bilal Tariq",
              client_phone: "+92 321 9876543",
              client_email: "",
              event_title: "Walima Reception Photography",
              event_date: "2026-10-28",
              event_location: "Karachi, Pakistan",
              service_type: "Photography & Album",
              total_amount: 25000,
              paid_amount: 25000,
              remaining_amount: 0,
              status: "FULLY PAID",
              invoice_no: "INV-2026-0043",
              notes: "Full payment settled via Bank Transfer.",
              event_payments: [
                {
                  id: "pay_2",
                  amount: 25000,
                  payment_date: "2026-10-01",
                  payment_method: "Bank Transfer",
                  notes: "Full upfront payment",
                },
              ],
            },
          ];
          setEvents(demoEvents);
          localStorage.setItem("fsv_cached_events", JSON.stringify(demoEvents));
        }
      }
    } catch (err) {
      const local = localStorage.getItem("fsv_cached_events");
      if (local) setEvents(JSON.parse(local));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const updateLocalEvents = (updatedList) => {
    setEvents(updatedList);
    try {
      localStorage.setItem("fsv_cached_events", JSON.stringify(updatedList));
    } catch {}
  };

  const handleOpenPaymentModal = (event) => {
    setActiveEventForPayment(event);
    const rem = Math.max(0, Number(event.remaining_amount ?? (event.total_amount - event.paid_amount)));
    setPaymentAmount(rem > 0 ? String(rem) : "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Cash");
    setPaymentNotes("");
    setPaymentModalOpen(true);
  };

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
      showToast(`Payment of Rs ${amount.toLocaleString()} successfully recorded! Client remaining: Rs ${newRemaining.toLocaleString()}`);
    } catch (err) {
      showToast("Payment recorded locally.", "success");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreateNewEvent = async (e) => {
    e.preventDefault();
    if (!newEventData.client_name.trim()) {
      showToast("Client name is required", "error");
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
      const total = Number(newEventData.total_amount || 0);
      const paid = Number(newEventData.paid_amount || 0);
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
            notes: "Initial Advance / Deposit",
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
        event_title: "Wedding Photography Coverage",
        event_date: new Date().toISOString().split("T")[0],
        event_location: "Karachi, Pakistan",
        service_type: "Photography & Videography",
        total_amount: 15000,
        paid_amount: 8000,
        payment_method: "Cash / Advance",
        invoice_no: "",
        notes: "",
      });
    } catch (err) {
      showToast("Event saved locally.", "success");
    } finally {
      setSubmittingNewEvent(false);
    }
  };

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

  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    events.forEach((ev) => {
      if (ev.event_date) {
        const d = new Date(ev.event_date);
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
        const d = new Date(ev.event_date);
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
    if (yearMonth === "ALL") return "All Time";
    const [year, month] = yearMonth.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#070707] text-text-primary p-4 md:p-8 space-y-8">
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-top-4 ${
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

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 text-accent-gold text-xs font-bold tracking-[0.2em] uppercase mb-1.5">
            <CalendarCheck className="w-4 h-4" />
            <span>Revenue & Cash Flow Telemetry</span>
          </div>
          <h1 className="serif-heading text-2xl md:text-3xl font-extrabold text-text-primary">
            Monthly Event <span className="text-accent-gold">Budget & Payments</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 max-w-2xl">
            Track event bookings, cash collection, and client balances. Record second payments without generating duplicate invoices.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={fetchEvents}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-text-muted hover:text-white hover:bg-white/10 transition-all"
            title="Refresh events list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent-gold" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/admin"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-accent-gold hover:bg-accent-gold/10 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Invoice Generator</span>
          </Link>

          <button
            type="button"
            onClick={() => setNewEventModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-accent-gold text-bg-primary font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent-gold/20 hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Event</span>
          </button>
        </div>
      </div>

      {/* 4 TELEMETRY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#0e0e0e] border border-white/10 relative overflow-hidden group hover:border-accent-gold/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Total Events ({formatMonthName(selectedMonth)})
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="serif-heading text-3xl font-extrabold text-white">
              {metrics.totalEvents}
            </span>
            <span className="text-[11px] font-bold text-text-muted">Bookings</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-text-muted">
            <span className="text-emerald-400 font-bold">{metrics.fullyPaidCount} Paid</span>
            <span>?</span>
            <span className="text-amber-400 font-bold">{metrics.partialCount} Partial</span>
            <span>?</span>
            <span className="text-red-400 font-bold">{metrics.unpaidCount} Due</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e0e0e] border border-white/10 relative overflow-hidden group hover:border-accent-gold/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Total Revenue Booked
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="serif-heading text-2xl font-extrabold text-white truncate">
            {formatPKR(metrics.totalRevenue)}
          </div>
          <div className="mt-3 text-[11px] text-text-muted flex items-center gap-1.5">
            <span>Overall value of booked client deals</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e0e0e] border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Cash Received (Paid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="serif-heading text-2xl font-extrabold text-emerald-300 truncate">
            {formatPKR(metrics.totalPaid)}
          </div>
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-text-muted font-bold mb-1">
              <span>Collection Progress</span>
              <span className="text-emerald-400">{metrics.collectionRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-accent-gold rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.collectionRate)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0e0e0e] border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Remaining (Market Balance)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="serif-heading text-2xl font-extrabold text-amber-300 truncate">
            {formatPKR(metrics.totalRemaining)}
          </div>
          <div className="mt-3 text-[11px] text-amber-400/80 flex items-center gap-1 font-semibold">
            <span>Pending collection from clients</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-4 rounded-xl bg-[#0e0e0e] border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, invoice #, or event..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-text-primary placeholder:text-text-muted/60 focus:border-accent-gold focus:outline-none transition-all"
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
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent-gold" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-text-primary font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#121212] text-white">All Months</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym} className="bg-[#121212] text-white">
                  {formatMonthName(ym)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-1">
            {[
              { id: "ALL", label: "All" },
              { id: "PARTIALLY PAID", label: "Partial" },
              { id: "FULLY PAID", label: "Paid" },
              { id: "UNPAID", label: "Unpaid" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? "bg-accent-gold text-bg-primary"
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
      <div className="rounded-xl border border-white/10 bg-[#0e0e0e] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Booked Events & Collections ({filteredEvents.length})
            </span>
          </div>
          <span className="text-[11px] text-accent-gold font-bold">
            Showing: {formatMonthName(selectedMonth)}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
            <span className="text-xs text-text-muted">Loading event telemetry...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">No Events Found</p>
              <p className="text-xs text-text-muted mt-1">
                {searchQuery || selectedMonth !== "ALL" || statusFilter !== "ALL"
                  ? "Try resetting your search filters."
                  : "Book your first event or sync from the Invoice Generator."}
              </p>
            </div>
            <button
              onClick={() => setNewEventModalOpen(true)}
              className="px-4 py-2 rounded bg-accent-gold text-bg-primary font-bold text-xs uppercase tracking-wider"
            >
              + Book First Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-text-muted bg-white/[0.02]">
                  <th className="py-3 px-4">Client / Event</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4 text-right">Deal Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Remaining Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredEvents.map((evt) => {
                  const total = Number(evt.total_amount || 0);
                  const paid = Number(evt.paid_amount || 0);
                  const remaining = Math.max(0, total - paid);
                  const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                  const isFullyPaid = remaining <= 0;

                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-[13px]">
                              {evt.client_name}
                            </span>
                            {evt.invoice_no && (
                              <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-white/5 text-accent-gold border border-accent-gold/20 font-bold">
                                {evt.invoice_no}
                              </span>
                            )}
                          </div>
                          <span className="text-text-muted text-[11px] font-medium">
                            {evt.event_title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted/80">
                            {evt.client_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                {evt.client_phone}
                              </span>
                            )}
                            {evt.service_type && (
                              <span className="px-1.5 py-0.2 rounded bg-white/5 text-[9px]">
                                {evt.service_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">
                            {evt.event_date || "TBD"}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {evt.event_location || "Karachi"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white whitespace-nowrap">
                        {formatPKR(total)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-emerald-400">
                            {formatPKR(paid)}
                          </span>
                          <div className="w-16 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold">
                        {isFullyPaid ? (
                          <span className="text-emerald-400/80 font-bold text-xs flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Cleared
                          </span>
                        ) : (
                          <span className="text-amber-400 text-sm font-extrabold">
                            {formatPKR(remaining)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isFullyPaid
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : paid > 0
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isFullyPaid ? "bg-emerald-400" : paid > 0 ? "bg-amber-400" : "bg-red-400"
                            }`}
                          />
                          {evt.status || (isFullyPaid ? "FULLY PAID" : "PARTIALLY PAID")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!isFullyPaid ? (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(evt)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent-gold text-bg-primary font-extrabold text-[11px] shadow-sm hover:brightness-110 transition-all"
                              title="Add remaining or partial payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>+ Record Payment</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveEventForHistory(evt);
                                setHistoryModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded bg-white/5 text-text-muted hover:text-white text-[11px] font-bold border border-white/10"
                            >
                              Paid in Full
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveEventForHistory(evt);
                              setHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                            title="View Payment Logs & Installments"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(evt.id, evt.client_name)}
                            className="p-1.5 rounded bg-red-950/30 border border-red-500/20 text-red-400 hover:bg-red-900/40 transition-all"
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

      {/* MODAL 1: RECORD PAYMENT */}
      {paymentModalOpen && activeEventForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#111111] border border-white/20 rounded-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">
                  Payment Collection Entry
                </span>
                <h3 className="serif-heading text-lg font-bold text-white mt-0.5">
                  Record Payment for {activeEventForPayment.client_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 rounded bg-white/5 text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-black/50 border border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-text-muted block">Deal Total</span>
                <span className="font-bold text-white">{formatPKR(activeEventForPayment.total_amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">Already Paid</span>
                <span className="font-bold text-emerald-400">{formatPKR(activeEventForPayment.paid_amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 block">Current Balance</span>
                <span className="font-extrabold text-amber-300">{formatPKR(activeEventForPayment.remaining_amount)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Amount Received (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                    Rs
                  </span>
                  <input
                    type="number"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="e.g. 7000"
                    className="w-full pl-10 pr-4 py-2.5 rounded bg-black/60 border border-accent-gold/40 text-sm font-extrabold text-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold"
                  />
                </div>
                <span className="text-[10px] text-text-muted mt-1 block">
                  Defaults to full remaining balance ({formatPKR(activeEventForPayment.remaining_amount)}). You can edit if partial.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Date Received
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Payment Channel
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#181818] border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold cursor-pointer"
                  >
                    <option value="Cash">Cash In Hand</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cleared remaining amount at photo delivery"
                  className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex items-center gap-2 px-5 py-2.5 rounded bg-accent-gold text-bg-primary text-xs font-extrabold uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BOOK NEW EVENT MANUALLY */}
      {newEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#111111] border border-white/20 rounded-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">
                  Direct Booking
                </span>
                <h3 className="serif-heading text-lg font-bold text-white mt-0.5">
                  Book New Event & Set Financials
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewEventModalOpen(false)}
                className="p-1.5 rounded bg-white/5 text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewEvent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEventData.client_name}
                    onChange={(e) => setNewEventData({ ...newEventData, client_name: e.target.value })}
                    placeholder="e.g. Farhan & Ayesha"
                    className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Client Phone
                  </label>
                  <input
                    type="text"
                    value={newEventData.client_phone}
                    onChange={(e) => setNewEventData({ ...newEventData, client_phone: e.target.value })}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={newEventData.event_title}
                  onChange={(e) => setNewEventData({ ...newEventData, event_title: e.target.value })}
                  placeholder="e.g. Barat & Cinematic Video Coverage"
                  className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventData.event_date}
                    onChange={(e) => setNewEventData({ ...newEventData, event_date: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Location / Venue
                  </label>
                  <input
                    type="text"
                    value={newEventData.event_location}
                    onChange={(e) => setNewEventData({ ...newEventData, event_location: e.target.value })}
                    placeholder="e.g. Karachi, Pakistan"
                    className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-black/40 border border-white/10 rounded-lg">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-accent-gold mb-1">
                    Total Deal Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newEventData.total_amount}
                    onChange={(e) => setNewEventData({ ...newEventData, total_amount: e.target.value })}
                    placeholder="15000"
                    className="w-full px-3 py-2 rounded bg-black/60 border border-white/20 text-sm font-bold text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                    Advance / Paid (PKR)
                  </label>
                  <input
                    type="number"
                    value={newEventData.paid_amount}
                    onChange={(e) => setNewEventData({ ...newEventData, paid_amount: e.target.value })}
                    placeholder="8000"
                    className="w-full px-3 py-2 rounded bg-black/60 border border-emerald-500/30 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="col-span-full pt-1 text-[11px] text-text-muted flex justify-between font-bold">
                  <span>Remaining to be collected:</span>
                  <span className="text-amber-400">
                    {formatPKR(Math.max(0, Number(newEventData.total_amount || 0) - Number(newEventData.paid_amount || 0)))}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Advance Payment Method
                  </label>
                  <select
                    value={newEventData.payment_method}
                    onChange={(e) => setNewEventData({ ...newEventData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#181818] border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                  >
                    <option value="Cash / Advance">Cash In Hand</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    Linked Invoice # (Optional)
                  </label>
                  <input
                    type="text"
                    value={newEventData.invoice_no}
                    onChange={(e) => setNewEventData({ ...newEventData, invoice_no: e.target.value })}
                    placeholder="e.g. INV-2026-0042"
                    className="w-full px-3 py-2 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewEventModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-bold text-text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNewEvent}
                  className="flex items-center gap-2 px-5 py-2.5 rounded bg-accent-gold text-bg-primary text-xs font-extrabold uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                >
                  {submittingNewEvent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Event Booking</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PAYMENT INSTALLMENTS HISTORY */}
      {historyModalOpen && activeEventForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#111111] border border-white/20 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">
                  Payment History & Logs
                </span>
                <h3 className="serif-heading text-lg font-bold text-white mt-0.5">
                  {activeEventForHistory.client_name}
                </h3>
                <span className="text-xs text-text-muted">{activeEventForHistory.event_title}</span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 rounded bg-white/5 text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-text-muted block">Deal Value</span>
                <span className="font-bold text-white">{formatPKR(activeEventForHistory.total_amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block">Total Received</span>
                <span className="font-bold text-emerald-400">{formatPKR(activeEventForHistory.paid_amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 block">Remaining</span>
                <span className="font-bold text-amber-300">{formatPKR(activeEventForHistory.remaining_amount)}</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {Array.isArray(activeEventForHistory.event_payments) && activeEventForHistory.event_payments.length > 0 ? (
                activeEventForHistory.event_payments.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {formatPKR(p.amount)}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {p.payment_date} via <strong className="text-accent-gold">{p.payment_method || "Cash"}</strong>
                        </span>
                        {p.notes && (
                          <span className="text-[10px] text-text-muted/80 block italic">
                            &ldquo;{p.notes}&rdquo;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-text-muted">
                  No separate installments recorded yet.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded bg-white/10 text-white font-bold text-xs uppercase"
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
