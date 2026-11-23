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
  CalendarDays,
  MessageCircle,
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

  // View Mode: 'schedule' (Upcoming Shoots Calendar Table) vs 'bookings' (Finance Deals Table)
  const [activeTab, setActiveTab] = useState("schedule");
  const [scheduleTimeFilter, setScheduleTimeFilter] = useState("ALL"); // ALL, UPCOMING, THIS_MONTH, NEXT_MONTH, PAST

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
  const [eventDaysCount, setEventDaysCount] = useState(1);
  const [multiEventDates, setMultiEventDates] = useState([new Date().toISOString().split("T")[0]]);

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

  // Shoot Details Modal state (Logistics & Event Info, Zero Financial Overload)
  const [shootDetailsModalOpen, setShootDetailsModalOpen] = useState(false);
  const [activeShootForDetails, setActiveShootForDetails] = useState(null);

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
  const handleDaysCountChange = (num) => {
    const count = Math.max(1, Math.min(10, num));
    setEventDaysCount(count);
    const nextDates = [...multiEventDates];
    while (nextDates.length < count) {
      nextDates.push("");
    }
    setMultiEventDates(nextDates.slice(0, count));
  };

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
      const validDates = multiEventDates.filter(Boolean);
      const primaryDate = validDates[0] || newEventData.event_date || new Date().toISOString().split("T")[0];
      const datesMeta = validDates.length > 0 ? `[DATES:${validDates.join(",")}] ` : "";
      const durLabel = validDates.length > 1 ? `Duration: ${validDates.length} Days | ` : "";
      const notesPayload = `${datesMeta}${durLabel}${newEventData.notes || ""}`;

      const payload = {
        ...newEventData,
        event_date: primaryDate,
        notes: notesPayload,
      };

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      const remaining = Math.max(0, total - paid);
      const status = paid <= 0 ? "UNPAID" : remaining <= 0 ? "FULLY PAID" : "PARTIALLY PAID";

      const newEvt = data?.event || {
        id: `evt_${Date.now()}`,
        ...payload,
        total_amount: total,
        paid_amount: paid,
        remaining_amount: remaining,
        status,
        event_payments: paid > 0 ? [
          {
            id: `pay_init_${Date.now()}`,
            amount: paid,
            payment_date: primaryDate,
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
      setEventDaysCount(1);
      setMultiEventDates([new Date().toISOString().split("T")[0]]);
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

  // Extract all individual shoot dates (multi-day shoots flattened into chronological items)
  const allShoots = useMemo(() => {
    const list = [];
    events.forEach((ev) => {
      let dates = [];
      const notes = ev.notes || "";
      if (notes.includes("[DATES:")) {
        try {
          const dPart = notes.split("[DATES:")[1].split("]")[0];
          dates = dPart.split(",").map((d) => d.trim()).filter(Boolean);
        } catch {}
      }
      if (dates.length === 0 && ev.event_date) {
        dates = [ev.event_date];
      }

      dates.forEach((dStr, idx) => {
        const total = Number(ev.total_amount || 0);
        const paid = Number(ev.paid_amount || 0);
        const remaining = Math.max(0, total - paid);
        list.push({
          shootId: `${ev.id}_${idx}`,
          eventId: ev.id,
          clientName: ev.client_name,
          clientEmail: ev.client_email,
          invoiceNo: ev.invoice_no,
          clientPhone: ev.client_phone,
          shootDate: dStr,
          dayIndex: idx + 1,
          totalDays: dates.length,
          dayLabel: dates.length > 1 ? `Day ${idx + 1} of ${dates.length}` : (notes.includes("Duration:") ? notes.match(/Duration: ([^|]+)/)?.[1]?.trim() || "1 Day" : "1 Day"),
          scope: ev.service_type || ev.event_title || "Photography Services",
          eventTitle: ev.event_title,
          location: ev.event_location || "Karachi, Pakistan",
          notes: notes,
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: remaining,
          status: ev.status,
          rawEvent: ev,
        });
      });
    });

    // Sort chronologically ascending (earliest upcoming to furthest)
    list.sort((a, b) => {
      const da = new Date(a.shootDate + (a.shootDate.includes("T") ? "" : "T00:00:00")).getTime() || 0;
      const db = new Date(b.shootDate + (b.shootDate.includes("T") ? "" : "T00:00:00")).getTime() || 0;
      return da - db;
    });

    return list;
  }, [events]);

  // Filtered shoots based on schedule filters & search
  const filteredShoots = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}`;

    return allShoots.filter((shoot) => {
      const d = new Date(shoot.shootDate + (shoot.shootDate.includes("T") ? "" : "T00:00:00"));
      const isPast = !isNaN(d.getTime()) && d.getTime() < now.getTime();
      const monthKey = !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "";

      if (scheduleTimeFilter === "UPCOMING" && isPast) return false;
      if (scheduleTimeFilter === "THIS_MONTH" && monthKey !== currentMonthKey) return false;
      if (scheduleTimeFilter === "NEXT_MONTH" && monthKey !== nextMonthKey) return false;
      if (scheduleTimeFilter === "PAST" && !isPast) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const m1 = shoot.clientName.toLowerCase().includes(q);
        const m2 = (shoot.invoiceNo || "").toLowerCase().includes(q);
        const m3 = shoot.scope.toLowerCase().includes(q);
        const m4 = (shoot.clientPhone || "").toLowerCase().includes(q);
        return m1 || m2 || m3 || m4;
      }
      return true;
    });
  }, [allShoots, scheduleTimeFilter, searchQuery]);

  // Compute countdown / relative label for each shoot date
  const getRelativeDateInfo = (dateStr) => {
    if (!dateStr) return { label: "TBD", color: "text-text-muted bg-white/5 border-white/10" };
    try {
      const target = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
      if (isNaN(target.getTime())) return { label: dateStr, color: "text-text-muted bg-white/5 border-white/10" };

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - now.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return { label: "Today", color: "text-emerald-300 bg-emerald-950/80 border-emerald-500/50 font-extrabold animate-pulse" };
      } else if (diffDays === 1) {
        return { label: "Tomorrow", color: "text-amber-300 bg-amber-950/80 border-amber-500/50 font-bold" };
      } else if (diffDays > 1 && diffDays <= 7) {
        return { label: `In ${diffDays} Days`, color: "text-accent-gold bg-accent-gold/15 border-accent-gold/40 font-bold" };
      } else if (diffDays > 7 && diffDays <= 30) {
        return { label: `In ${diffDays} Days`, color: "text-blue-300 bg-blue-950/50 border-blue-500/30 font-semibold" };
      } else if (diffDays > 30) {
        return { label: "Next Month", color: "text-purple-300 bg-purple-950/40 border-purple-500/30" };
      } else {
        return { label: "Completed", color: "text-text-muted/60 bg-white/5 border-white/5" };
      }
    } catch {
      return { label: dateStr, color: "text-text-muted bg-white/5 border-white/10" };
    }
  };

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

  const scheduleMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    let upcomingCount = 0;
    let todayCount = 0;
    let thisMonthCount = 0;
    let nextMonthCount = 0;

    allShoots.forEach((s) => {
      if (s.shootDate >= todayStr) {
        upcomingCount++;
      }
      if (s.shootDate === todayStr) {
        todayCount++;
      }
      if (s.shootDate) {
        const d = new Date(s.shootDate + (s.shootDate.includes("T") ? "" : "T00:00:00"));
        if (!isNaN(d.getTime())) {
          if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
            thisMonthCount++;
          } else if (
            (d.getFullYear() === curYear && d.getMonth() === curMonth + 1) ||
            (curMonth === 11 && d.getFullYear() === curYear + 1 && d.getMonth() === 0)
          ) {
            nextMonthCount++;
          }
        }
      }
    });

    return {
      totalShoots: allShoots.length,
      upcomingCount,
      todayCount,
      thisMonthCount,
      nextMonthCount,
    };
  }, [allShoots]);

  const formatEventDateWithDay = (dateStr) => {
    if (!dateStr) return { date: "TBD", weekday: "" };
    try {
      const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
      if (isNaN(d.getTime())) return { date: dateStr, weekday: "" };
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
      return { date: `${day} ${month} ${year}`, weekday };
    } catch {
      return { date: dateStr, weekday: "" };
    }
  };

  const getShootStatus = (dateStr) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr === todayStr) {
      return {
        label: "Shooting Today",
        color: "text-emerald-300 bg-emerald-950/80 border-emerald-500/50 font-extrabold animate-pulse",
      };
    } else if (dateStr > todayStr) {
      return {
        label: "Scheduled",
        color: "text-sky-300 bg-sky-950/50 border-sky-500/40 font-semibold",
      };
    } else {
      return {
        label: "Completed",
        color: "text-text-muted/70 bg-white/5 border-white/10",
      };
    }
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
            <span>Event Budget</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Track client events, payments, and balances.
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
            <span>Book Event</span>
          </button>
        </div>
      </div>

      {/* TELEMETRY METRIC CARDS (Context-Aware: Schedule Metrics vs Financial Metrics) */}
      {activeTab === "schedule" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Upcoming Shoots */}
          <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Upcoming Shoots
              </span>
              <div className="w-8 h-8 rounded-lg bg-accent-gold/10 border border-accent-gold/20 text-accent-gold flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {scheduleMetrics.upcomingCount}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <span>{scheduleMetrics.todayCount} Shooting Today</span>
            </div>
          </div>

          {/* Card 2: Shoots This Month */}
          <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                This Month
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {scheduleMetrics.thisMonthCount}
            </div>
            <div className="mt-3 text-[11px] text-text-muted">
              Scheduled this month
            </div>
          </div>

          {/* Card 3: Next Month */}
          <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Next Month
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {scheduleMetrics.nextMonthCount}
            </div>
            <div className="mt-3 text-[11px] text-text-muted">
              Upcoming next month
            </div>
          </div>

          {/* Card 4: Total Booked Days */}
          <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Total Shoot Dates
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {allShoots.length}
            </div>
            <div className="mt-3 text-[11px] text-text-muted">
              Total scheduled shoot days
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Bookings */}
          <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Total Bookings
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

          {/* Card 2: Total Revenue */}
          <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Total Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono truncate">
              {formatPKR(metrics.totalRevenue)}
            </div>
            <div className="mt-3 text-[11px] text-text-muted">
              Total deal value
            </div>
          </div>

          {/* Card 3: Cash Received */}
          <div className="bg-[#121212] rounded-2xl p-5 border border-emerald-500/20 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Cash Received
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
                Remaining Balance
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono truncate">
              {formatPKR(metrics.totalRemaining)}
            </div>
            <div className="mt-3 text-[11px] text-amber-400/80 font-medium">
              Pending collection
            </div>
          </div>
        </div>
      )}

      {/* VIEW SWITCHER TABS: UPCOMING SCHEDULE vs BOOKINGS & BUDGET */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 p-1 bg-[#141414] border border-white/10 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "schedule"
                ? "bg-accent-gold text-bg-primary shadow-sm font-extrabold"
                : "text-text-muted hover:text-white"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Upcoming Schedule ({allShoots.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "bookings"
                ? "bg-accent-gold text-bg-primary shadow-sm font-extrabold"
                : "text-text-muted hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Bookings &amp; Budget ({events.length})</span>
          </button>
        </div>

        {/* Schedule Sub-Filters (Visible in Schedule View) */}
        {activeTab === "schedule" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "All Dates" },
              { id: "UPCOMING", label: "Upcoming" },
              { id: "THIS_MONTH", label: "This Month" },
              { id: "NEXT_MONTH", label: "Next Month" },
              { id: "PAST", label: "Past" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setScheduleTimeFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  scheduleTimeFilter === f.id
                    ? "bg-accent-gold/15 border-accent-gold text-accent-gold font-bold"
                    : "bg-[#141414] border-white/10 text-text-muted hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
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

        {/* Month Selector & Status Tabs for Bookings View */}
        {activeTab === "bookings" && (
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Custom Luxury Month Selector */}
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: UPCOMING SHOOT SCHEDULE TABLE (DATE-WISE TIMELINE) */}
      {/* ========================================================================= */}
      {activeTab === "schedule" && (
        <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-accent-gold" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Upcoming Shoot Dates &amp; Timeline ({filteredShoots.length})
              </h2>
            </div>
            <span className="text-[11px] text-text-muted font-medium">
              Sorted Chronologically by Date
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-text-muted gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
              <span className="text-xs">Loading shoot schedule...</span>
            </div>
          ) : filteredShoots.length === 0 ? (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-bold text-white">No Shoots Found</p>
                <p className="text-xs text-text-muted mt-1 max-w-sm">
                  {searchQuery || scheduleTimeFilter !== "ALL"
                    ? "No shoots match your filter or search."
                    : "No shoots scheduled yet. Create an invoice or book an event to see dates."}
                </p>
              </div>
              <button
                onClick={() => setNewEventModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-bg-primary font-extrabold text-xs uppercase tracking-wider hover:bg-accent-warm shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Book Event</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-text-muted font-bold uppercase tracking-wider text-[10px] bg-[#161616]">
                    <th className="px-5 py-3.5">Shoot Date</th>
                    <th className="px-5 py-3.5">Client &amp; Contact</th>
                    <th className="px-5 py-3.5">Event &amp; Scope</th>
                    <th className="px-5 py-3.5">Venue / Location</th>
                    <th className="px-5 py-3.5">Shoot Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredShoots.map((shoot) => {
                    const rel = getRelativeDateInfo(shoot.shootDate);
                    const dateObj = formatEventDateWithDay(shoot.shootDate);
                    const shootStatus = getShootStatus(shoot.shootDate);

                    return (
                      <tr
                        key={shoot.shootId}
                        className="hover:bg-white/[0.03] transition-colors"
                      >
                        {/* 1. Shoot Date with Day of Week & Countdown Badge */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-[13.5px] font-mono">
                                {dateObj.date}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider border ${rel.color}`}
                              >
                                {rel.label}
                              </span>
                            </div>
                            {dateObj.weekday && (
                              <span className="text-[11px] text-accent-gold/80 font-medium">
                                {dateObj.weekday}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Client Name, Invoice & Contact / WhatsApp */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-[13.5px]">
                                {shoot.clientName}
                              </span>
                              {shoot.invoiceNo && (
                                <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-accent-gold/10 text-accent-gold border border-accent-gold/25 font-bold">
                                  {shoot.invoiceNo}
                                </span>
                              )}
                            </div>
                            {shoot.clientPhone ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={`https://wa.me/${shoot.clientPhone.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                                  title="Chat on WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-400" />
                                  <span>{shoot.clientPhone}</span>
                                </a>
                              </div>
                            ) : (
                              <span className="text-[10px] text-text-muted/50 italic">
                                No phone recorded
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Event & Scope (Day label + Service scope) */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-accent-gold/15 text-accent-gold font-bold text-[10px] border border-accent-gold/30">
                                {shoot.dayLabel}
                              </span>
                              {shoot.eventTitle && shoot.eventTitle !== shoot.scope && (
                                <span className="font-semibold text-white text-xs">
                                  {shoot.eventTitle}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                              <Camera className="w-3 h-3 text-accent-gold/60 shrink-0" />
                              <span className="truncate max-w-xs">{shoot.scope}</span>
                            </span>
                          </div>
                        </td>

                        {/* 4. Venue / Location */}
                        <td className="px-5 py-4 whitespace-nowrap text-text-muted text-xs">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-accent-gold/70 shrink-0" />
                            <span className="text-white/90 font-medium">{shoot.location}</span>
                          </div>
                        </td>

                        {/* 5. Shoot Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] border ${shootStatus.color}`}>
                            {shootStatus.label}
                          </span>
                        </td>

                        {/* 6. Actions: View Shoot Details */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveShootForDetails(shoot);
                                setShootDetailsModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-text-primary hover:text-accent-gold hover:border-accent-gold/40 hover:bg-white/10 transition-all text-xs font-semibold cursor-pointer shadow-sm"
                              title="View Event Logistics & Shoot Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Details</span>
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BOOKINGS & BUDGET MAIN TABLE */}
      {/* ========================================================================= */}
      {activeTab === "bookings" && (
        <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-4 h-4 text-accent-gold" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Booked Events ({filteredEvents.length})
              </h2>
            </div>
            <span className="text-[11px] text-text-muted">
              Viewing: <strong className="text-accent-gold">{formatMonthName(selectedMonth)}</strong>
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-text-muted gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
              <span className="text-xs">Loading events...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-20 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-bold text-white">No Events Found</p>
                <p className="text-xs text-text-muted mt-1 max-w-sm">
                  {searchQuery || selectedMonth !== "ALL" || statusFilter !== "ALL"
                    ? "No bookings match your selected search or filter."
                    : "No events recorded yet. Click below to book an event or create an invoice."}
                </p>
              </div>
              <button
                onClick={() => setNewEventModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-gold text-bg-primary font-extrabold text-xs uppercase tracking-wider hover:bg-accent-warm shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Book Event</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-text-muted font-bold uppercase tracking-wider text-[10px] bg-[#161616]">
                    <th className="px-5 py-3.5">Client &amp; Scope</th>
                    <th className="px-5 py-3.5">Event Date</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                    <th className="px-5 py-3.5 text-right">Paid</th>
                    <th className="px-5 py-3.5 text-right">Remaining</th>
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

                        {/* 7. Actions */}
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
      )}

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
                  Log installment or balance payment.
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { key: "Cash", label: "Cash" },
                      { key: "Bank Transfer", label: "Bank" },
                      { key: "JazzCash / EasyPaisa", label: "Jazz/Easy" },
                      { key: "Online Payment", label: "Online" },
                      { key: "Cheque", label: "Cheque" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setPaymentMethod(m.key)}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                          paymentMethod === m.key
                            ? "bg-accent-gold/20 text-accent-gold border-accent-gold shadow-sm font-bold"
                            : "bg-[#141414] text-text-muted border-white/10 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
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
      {/* MODAL 2: BOOK EVENT */}
      {/* ========================================================================= */}
      {newEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-accent-gold" />
                  <span>Book Event</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Enter client booking details.
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

              {/* Service Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">
                    Service Scope
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      "Photography & Videography",
                      "Photography Services",
                      "Cinematic Videography",
                      "Drone Cinematography",
                      "Complete Wedding Coverage",
                    ].map((srv) => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => setNewEventData({ ...newEventData, service_type: srv })}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left truncate ${
                          newEventData.service_type === srv
                            ? "bg-accent-gold/20 text-accent-gold border-accent-gold shadow-sm font-bold"
                            : "bg-[#141414] text-text-muted border-white/10 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        {srv}
                      </button>
                    ))}
                  </div>
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

              {/* Multi-Day Dates Selector */}
              <div className="space-y-2 p-3 bg-[#181818] border border-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-accent-gold flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Shoot Days ({eventDaysCount})</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDaysCountChange(d)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                          eventDaysCount === d
                            ? "bg-accent-gold text-bg-primary"
                            : "bg-white/5 text-text-muted hover:text-white"
                        }`}
                      >
                        {d} {d === 1 ? "Day" : "Days"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {multiEventDates.map((dVal, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-[9.5px] text-text-muted font-semibold uppercase">
                        Day {idx + 1} Shoot Date:
                      </span>
                      <input
                        type="date"
                        required
                        value={dVal || ""}
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
                        onChange={(e) => {
                          const updated = [...multiEventDates];
                          updated[idx] = e.target.value;
                          setMultiEventDates(updated);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#121212] border border-white/10 text-xs text-white focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer font-medium [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  ))}
                </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { key: "Cash", label: "Cash" },
                      { key: "Bank Transfer", label: "Bank" },
                      { key: "JazzCash / EasyPaisa", label: "Jazz/Easy" },
                      { key: "Online Payment", label: "Online" },
                      { key: "Cheque", label: "Cheque" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setNewEventData({ ...newEventData, payment_method: m.key })}
                        className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                          newEventData.payment_method === m.key
                            ? "bg-accent-gold/20 text-accent-gold border-accent-gold shadow-sm font-bold"
                            : "bg-[#141414] text-text-muted border-white/10 hover:border-white/25 hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
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
                  Recorded installment history.
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

      {/* ========================================================================= */}
      {/* SHOOT DETAILS MODAL (Pure Event Logistics & Coordination, Zero Payment Clutter) */}
      {/* ========================================================================= */}
      {shootDetailsModalOpen && activeShootForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center text-accent-gold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Shoot Event Details
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Event logistics &amp; coordination
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShootDetailsModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client Card */}
            <div className="bg-[#181818] border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-white">
                    {activeShootForDetails.clientName}
                  </div>
                  {activeShootForDetails.invoiceNo && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded font-mono text-[9px] bg-accent-gold/10 text-accent-gold border border-accent-gold/25 font-bold">
                      {activeShootForDetails.invoiceNo}
                    </span>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] border ${getShootStatus(activeShootForDetails.shootDate).color}`}>
                  {getShootStatus(activeShootForDetails.shootDate).label}
                </span>
              </div>

              {activeShootForDetails.clientPhone && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Client Contact:</span>
                  <a
                    href={`https://wa.me/${activeShootForDetails.clientPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold hover:bg-emerald-900/50 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{activeShootForDetails.clientPhone}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Shoot Timeline & Logistics */}
            <div className="space-y-3">
              <div className="bg-[#181818] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                    Shoot Date &amp; Day
                  </span>
                  <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                    {formatEventDateWithDay(activeShootForDetails.shootDate).date}
                  </span>
                  <span className="text-[11px] text-accent-gold font-medium">
                    {formatEventDateWithDay(activeShootForDetails.shootDate).weekday}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-lg bg-accent-gold/15 text-accent-gold border border-accent-gold/30 text-xs font-bold">
                  {activeShootForDetails.dayLabel}
                </span>
              </div>

              <div className="bg-[#181818] border border-white/10 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Location / Venue
                </span>
                <div className="flex items-center gap-2 text-xs text-white">
                  <MapPin className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                  <span className="font-semibold">{activeShootForDetails.location}</span>
                </div>
              </div>

              <div className="bg-[#181818] border border-white/10 rounded-xl p-3.5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Service Scope
                </span>
                <div className="flex items-center gap-2 text-xs text-white">
                  <Camera className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                  <span>{activeShootForDetails.scope}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShootDetailsModalOpen(false);
                  setActiveTab("bookings");
                }}
                className="text-xs text-text-muted hover:text-accent-gold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View Financials &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setShootDetailsModalOpen(false)}
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
