"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Users,
  Eye,
  Globe2,
  Calendar,
  Laptop,
  Smartphone,
  Tablet,
  Bot,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  UserCheck,
  User,
  Filter,
  ExternalLink,
  ChevronRight,
  X,
  Compass,
  ArrowUpRight,
  FileSpreadsheet,
  Flame,
  TrendingUp,
  Zap,
  Radio,
  MapPin,
  Clock,
  ArrowLeft,
  LogOut,
  FileText,
  Sliders,
  ShieldCheck,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function groupVisitorLogsIntoSessions(logs) {
  if (!logs || logs.length === 0) {
    return { sessions: [], totalTimeSeconds: 0, totalTimeFormatted: "0s" };
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime()
  );

  const rawSessions = [];
  let current = [];

  for (const log of sorted) {
    if (current.length === 0) {
      current.push(log);
    } else {
      const prevTime = new Date(current[current.length - 1].visited_at).getTime();
      const currTime = new Date(log.visited_at).getTime();
      // If gap > 2 mins between pings, it's a new session
      if (currTime - prevTime > 2 * 60 * 1000) {
        rawSessions.push(current);
        current = [log];
      } else {
        current.push(log);
      }
    }
  }
  if (current.length > 0) {
    rawSessions.push(current);
  }

  let grandTotalSeconds = 0;

  const sessions = rawSessions.map((grp, idx) => {
    const startIso = grp[0].visited_at;
    const endIso = grp[grp.length - 1].visited_at;
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();
    const diffSec = Math.max(0, Math.floor((endMs - startMs) / 1000));

    grandTotalSeconds += diffSec;

    let durationFormatted = "Quick View (< 5s)";
    if (diffSec > 0) {
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      durationFormatted = mins > 0 ? `${mins}m ${secs}s on site` : `${secs}s on site`;
    }

    const uniquePages = Array.from(
      new Set(grp.map((g) => (g.path === "/" ? "Home / Portfolio" : g.path || "Home")))
    );

    return {
      id: `session_${idx + 1}`,
      startTime: startIso,
      endTime: endIso,
      durationSeconds: diffSec,
      durationFormatted,
      pageViews: grp.length,
      city: grp[0].city || "Unknown",
      country: grp[0].country || "Unknown",
      pages: uniquePages,
      logs: grp,
    };
  });

  const totalMins = Math.floor(grandTotalSeconds / 60);
  const totalSecs = grandTotalSeconds % 60;
  const totalTimeFormatted =
    totalMins > 0 ? `${totalMins}m ${totalSecs}s` : `${totalSecs}s`;

  return { sessions, totalTimeSeconds: grandTotalSeconds, totalTimeFormatted };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [visitors, setVisitors] = useState([]);
  const [visitLogs, setVisitLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & State
  const [filterMode, setFilterMode] = useState("human"); // "human" | "all" | "bot"
  const [dateRange, setDateRange] = useState("7d"); // "today" | "7d" | "30d" | "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [excludeOwner, setExcludeOwner] = useState(true);

  // Check login state
  useEffect(() => {
    try {
      const isAuth = localStorage.getItem("fsv_admin_logged_in") === "true";
      if (!isAuth) {
        // Redirect to login
        router.push("/admin/login");
      }
      const savedExcl = localStorage.getItem("fsv_exclude_owner");
      if (savedExcl !== null) {
        setExcludeOwner(savedExcl === "true");
      }
    } catch {}
  }, [router]);

  const handleToggleOwnerExclusion = (checked) => {
    setExcludeOwner(checked);
    try {
      localStorage.setItem("fsv_exclude_owner", checked ? "true" : "false");
    } catch {}
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem("fsv_admin_logged_in");
    } catch {}
    router.push("/admin/login");
  };

  const fetchAnalyticsData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase client not initialized. Please verify your Supabase keys.");
      }

      // Fetch Visitors, Logs and Events
      const [visitorsRes, logsRes, eventsRes] = await Promise.all([
        supabase
          .from("analytics_visitors")
          .select("*")
          .order("last_seen", { ascending: false })
          .limit(1000),
        supabase
          .from("analytics_visit_logs")
          .select("*")
          .order("visited_at", { ascending: false })
          .limit(2500),
        supabase
          .from("analytics_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);

      if (visitorsRes.error) throw visitorsRes.error;
      if (logsRes.error) throw logsRes.error;

      setVisitors(visitorsRes.data || []);
      setVisitLogs(logsRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError(err.message || "Could not load analytics. Make sure the SQL tables are created.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    // Auto refresh every 45 seconds for live telemetry
    const interval = setInterval(() => {
      fetchAnalyticsData(true);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Filter visitors by Date Range and Traffic Mode
  const filteredVisitors = useMemo(() => {
    const now = new Date().getTime();
    let cutoff = 0;
    if (dateRange === "today") cutoff = now - 24 * 60 * 60 * 1000;
    else if (dateRange === "7d") cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (dateRange === "30d") cutoff = now - 30 * 24 * 60 * 60 * 1000;

    return visitors.filter((v) => {
      // Date filter
      if (cutoff > 0) {
        const seen = new Date(v.last_seen || v.first_seen).getTime();
        if (seen < cutoff) return false;
      }

      // Traffic Mode filter
      if (filterMode === "human" && v.is_bot) return false;
      if (filterMode === "bot" && !v.is_bot) return false;

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (v.visitor_id || "").toLowerCase().includes(q);
        const matchCity = (v.city || "").toLowerCase().includes(q);
        const matchCountry = (v.country || "").toLowerCase().includes(q);
        const matchIp = (v.ip || "").toLowerCase().includes(q);
        const matchRef = (v.referrer || "").toLowerCase().includes(q);
        if (!matchId && !matchCity && !matchCountry && !matchIp && !matchRef) {
          return false;
        }
      }

      return true;
    });
  }, [visitors, filterMode, dateRange, searchQuery]);

  // Live online visitors (seen in last 60 seconds)
  const liveActiveCount = useMemo(() => {
    const threshold = Date.now() - 60 * 1000;
    return visitors.filter((v) => {
      if (v.is_bot) return false;
      const seen = new Date(v.last_seen).getTime();
      return seen >= threshold;
    }).length;
  }, [visitors]);

  // High-Level KPIs
  const totalPageViews = useMemo(() => {
    return filteredVisitors.reduce((acc, curr) => acc + (curr.visit_count || 1), 0);
  }, [filteredVisitors]);

  const botCount = useMemo(() => {
    return visitors.filter((v) => v.is_bot).length;
  }, [visitors]);

  // Geo Breakdown
  const countryBreakdown = useMemo(() => {
    const map = {};
    for (const v of filteredVisitors) {
      const c = v.country || "Unknown";
      map[c] = (map[c] || 0) + 1;
    }
    return Object.entries(map)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredVisitors]);

  // City Breakdown
  const cityBreakdown = useMemo(() => {
    const map = {};
    for (const v of filteredVisitors) {
      const key = v.city && v.city !== "Unknown" ? `${v.city}, ${v.country}` : v.country || "Unknown";
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredVisitors]);

  // Device & OS Breakdown
  const deviceBreakdown = useMemo(() => {
    let mobile = 0;
    let desktop = 0;
    let tablet = 0;
    for (const v of filteredVisitors) {
      if (v.device === "Mobile") mobile++;
      else if (v.device === "Tablet") tablet++;
      else desktop++;
    }
    return { mobile, desktop, tablet };
  }, [filteredVisitors]);

  // Referrer Breakdown
  const referrerBreakdown = useMemo(() => {
    const map = {};
    for (const v of filteredVisitors) {
      let r = v.referrer || "Direct";
      if (r.includes("instagram")) r = "Instagram";
      else if (r.includes("facebook") || r.includes("fb")) r = "Facebook";
      else if (r.includes("whatsapp") || r.includes("wa.me")) r = "WhatsApp";
      else if (r.includes("google")) r = "Google Search";
      else if (r.includes("tiktok")) r = "TikTok";
      map[r] = (map[r] || 0) + 1;
    }
    return Object.entries(map)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredVisitors]);

  // Selected Visitor Sessions & Logs
  const selectedVisitorData = useMemo(() => {
    if (!selectedVisitor) return null;
    const logs = visitLogs.filter((l) => l.visitor_id === selectedVisitor.visitor_id);
    const visitorEvents = events.filter((e) => e.visitor_id === selectedVisitor.visitor_id);
    const sessionGroup = groupVisitorLogsIntoSessions(logs);
    return {
      visitor: selectedVisitor,
      logs,
      events: visitorEvents,
      sessions: sessionGroup.sessions,
      totalTimeFormatted: sessionGroup.totalTimeFormatted,
    };
  }, [selectedVisitor, visitLogs, events]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredVisitors.length === 0) return;
    const headers = [
      "Visitor ID",
      "Type",
      "Country",
      "City",
      "IP",
      "Device",
      "OS",
      "Browser",
      "Referrer",
      "Visit Count",
      "First Seen",
      "Last Seen",
    ];
    const rows = filteredVisitors.map((v) => [
      v.visitor_id,
      v.is_bot ? `Bot (${v.bot_type || "Crawler"})` : "Human",
      v.country,
      v.city,
      v.ip,
      v.device,
      v.os,
      v.browser,
      v.referrer,
      v.visit_count,
      v.first_seen,
      v.last_seen,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val || ""}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `FS_Visuals_Telemetry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#070707] text-text-primary flex flex-col font-sans p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Banner & Live Beacon */}
      <div className="bg-[#121212] border border-white/10 p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.25em] text-accent-gold uppercase block">
              LIVE TRAFFIC &amp; AUDIENCE TELEMETRY
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>{liveActiveCount} Live Online Now</span>
            </div>
          </div>
          <h1 className="serif-heading text-xl sm:text-2xl font-bold text-text-primary mt-1">
            Visitor Insights &amp; Geo Locations
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Exact records of who is visiting FS Visuals, locations, dwell durations, and device stats.
          </p>
        </div>

        {/* Actions & Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/5 border border-white/10 hover:border-accent-gold hover:text-accent-gold text-text-primary uppercase tracking-wider transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent-gold" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredVisitors.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-accent-gold text-bg-primary uppercase tracking-wider font-extrabold hover:bg-accent-warm transition-all disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Notice if Supabase connection has an issue */}
      {error && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs rounded space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Database Connection Notice</span>
          </div>
          <p>{error}</p>
          <p className="text-[11px] text-amber-300/80">
            Ensure that your Supabase tables are created and environment variables (<code className="bg-black/40 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> &amp; <code className="bg-black/40 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) are configured in your Vercel Project Settings.
          </p>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Live Active */}
          <div className="bg-[#121212] border border-white/10 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase">Live Visitors</span>
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {liveActiveCount}
            </div>
            <span className="text-[10px] text-text-muted mt-1">Active in the last 60 seconds</span>
          </div>

          {/* 2. Total Unique Visitors */}
          <div className="bg-[#121212] border border-white/10 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase">Unique Visitors</span>
              <Users className="w-4 h-4 text-accent-gold" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono">
              {filteredVisitors.length}
            </div>
            <span className="text-[10px] text-text-muted mt-1">
              {filterMode === "human" ? "Real Genuine Humans" : "Total Traffic Sessions"}
            </span>
          </div>

          {/* 3. Total Page Hits */}
          <div className="bg-[#121212] border border-white/10 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase">Total Views &amp; Hits</span>
              <Eye className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-text-primary font-mono">
              {totalPageViews}
            </div>
            <span className="text-[10px] text-text-muted mt-1">Total page navigations logged</span>
          </div>

          {/* 4. Top Country & Bots */}
          <div className="bg-[#121212] border border-white/10 p-4 sm:p-5 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase">Top Location</span>
              <Globe2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-accent-gold truncate">
              {countryBreakdown[0]?.country || "Pakistan"}
            </div>
            <span className="text-[10px] text-text-muted mt-1">
              {countryBreakdown[0] ? `${countryBreakdown[0].count} visits from here` : "No visits yet"}
            </span>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="bg-[#121212] border border-white/10 p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          {/* Traffic Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#1b1b1b] p-1 border border-white/10 w-full md:w-auto">
            <button
              onClick={() => setFilterMode("human")}
              className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                filterMode === "human"
                  ? "bg-accent-gold text-bg-primary shadow-sm"
                  : "text-text-muted hover:text-white"
              }`}
            >
              Humans Only ({visitors.filter((v) => !v.is_bot).length})
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                filterMode === "all"
                  ? "bg-accent-gold text-bg-primary shadow-sm"
                  : "text-text-muted hover:text-white"
              }`}
            >
              All Traffic ({visitors.length})
            </button>
            <button
              onClick={() => setFilterMode("bot")}
              className={`flex-1 md:flex-none px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
                filterMode === "bot"
                  ? "bg-accent-gold text-bg-primary shadow-sm"
                  : "text-text-muted hover:text-white"
              }`}
            >
              Bots &amp; Crawlers ({botCount})
            </button>
          </div>

          {/* Date Range & Search */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search city, IP, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1b1b1b] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-text-primary focus:border-accent-gold focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Date Select */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-[#1b1b1b] border border-white/10 px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-gold focus:outline-none cursor-pointer"
            >
              <option value="today">Today (24h)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Visual Distribution Grids: Locations, Devices, Referrers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Countries & Cities */}
          <div className="bg-[#121212] border border-white/10 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent-gold" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-text-primary">
                  Top Geo Locations
                </h3>
              </div>
              <span className="text-[10px] text-text-muted">Top Cities</span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cityBreakdown.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-6">No location data yet.</p>
              ) : (
                cityBreakdown.slice(0, 7).map((item, idx) => {
                  const pct = Math.round((item.count / filteredVisitors.length) * 100) || 1;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-primary font-medium truncate pr-2">
                          {item.location}
                        </span>
                        <span className="text-accent-gold font-mono font-bold">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-gold"
                          style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Devices & Platforms */}
          <div className="bg-[#121212] border border-white/10 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-accent-gold" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-text-primary">
                  Devices &amp; Screen Types
                </h3>
              </div>
              <span className="text-[10px] text-text-muted">Breakdown</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-3 bg-[#1b1b1b] border border-white/5 text-center flex flex-col items-center">
                <Smartphone className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-base font-bold font-mono text-text-primary">
                  {deviceBreakdown.mobile}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Mobile</span>
              </div>

              <div className="p-3 bg-[#1b1b1b] border border-white/5 text-center flex flex-col items-center">
                <Laptop className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-base font-bold font-mono text-text-primary">
                  {deviceBreakdown.desktop}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Desktop</span>
              </div>

              <div className="p-3 bg-[#1b1b1b] border border-white/5 text-center flex flex-col items-center">
                <Tablet className="w-5 h-5 text-purple-400 mb-1" />
                <span className="text-base font-bold font-mono text-text-primary">
                  {deviceBreakdown.tablet}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted">Tablet</span>
              </div>
            </div>

            {/* Quick OS snippet */}
            <div className="pt-2 text-xs text-text-muted flex justify-between border-t border-white/5">
              <span>Primary Traffic Platform:</span>
              <span className="text-accent-gold font-bold">
                {deviceBreakdown.mobile >= deviceBreakdown.desktop ? "Mobile Focused" : "Desktop Focused"}
              </span>
            </div>
          </div>

          {/* 3. Traffic Sources & Referrers */}
          <div className="bg-[#121212] border border-white/10 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-accent-gold" />
                <h3 className="text-xs font-bold tracking-widest uppercase text-text-primary">
                  Traffic Sources / Referrers
                </h3>
              </div>
              <span className="text-[10px] text-text-muted">Channels</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {referrerBreakdown.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-6">No referrer data yet.</p>
              ) : (
                referrerBreakdown.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[#1b1b1b] border border-white/5 text-xs"
                  >
                    <span className="text-text-primary font-medium truncate pr-2">
                      {item.source}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-accent-gold font-bold">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detailed Visitor Telemetry Records Table */}
        <div className="bg-[#121212] border border-white/10 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="serif-heading text-lg font-bold text-text-primary">
                Detailed Visitor Logs
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Click on any visitor row or timeline button to view their full session history &amp; time spent.
              </p>
            </div>
            <span className="text-xs text-accent-gold font-mono font-semibold">
              Showing {filteredVisitors.length} recorded visitors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-muted">
              <thead className="bg-[#181818] text-text-primary uppercase text-[10px] font-bold tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Visitor / Type</th>
                  <th className="py-3 px-4">Location &amp; IP</th>
                  <th className="py-3 px-4">Device &amp; OS</th>
                  <th className="py-3 px-4">Referrer</th>
                  <th className="py-3 px-4 text-center">Visits</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent-gold mb-2" />
                      <span>Loading real-time visitor records...</span>
                    </td>
                  </tr>
                ) : filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      No visitor records found for current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((v) => {
                    const isOnline = Date.now() - new Date(v.last_seen).getTime() < 60 * 1000;
                    return (
                      <tr
                        key={v.visitor_id}
                        onClick={() => setSelectedVisitor(v)}
                        className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                      >
                        {/* Visitor ID & Type */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isOnline && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online now" />
                            )}
                            <div>
                              <span className="font-mono text-text-primary font-bold block">
                                {v.visitor_name || v.visitor_id.substring(0, 14)}...
                              </span>
                              {v.is_bot ? (
                                <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                                  🤖 {v.bot_type || "Crawler"}
                                </span>
                              ) : (
                                <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                                  ✓ Human Visitor
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <div className="text-text-primary font-medium">
                            {v.city && v.city !== "Unknown" ? `${v.city}, ${v.country}` : v.country || "Unknown"}
                          </div>
                          <span className="text-[10px] text-text-muted font-mono">{v.ip || "Direct"}</span>
                        </td>

                        {/* Device */}
                        <td className="py-3 px-4">
                          <div className="text-text-primary">
                            {v.device} • {v.os}
                          </div>
                          <span className="text-[10px] text-text-muted">{v.browser}</span>
                        </td>

                        {/* Referrer */}
                        <td className="py-3 px-4 truncate max-w-[140px]" title={v.referrer}>
                          <span className="text-text-primary font-medium">{v.referrer || "Direct"}</span>
                        </td>

                        {/* Visits */}
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-white/5 font-mono text-accent-gold font-bold">
                            {v.visit_count || 1}
                          </span>
                        </td>

                        {/* Last Seen */}
                        <td className="py-3 px-4">
                          <span className="text-text-primary block font-mono">
                            {new Date(v.last_seen).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(v.last_seen).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVisitor(v);
                            }}
                            className="text-[11px] font-bold text-accent-gold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Timeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Visitor Timeline & Session Details Modal / Drawer */}
      {selectedVisitor && selectedVisitorData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-[#121212] border border-white/15 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-[#181818]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-accent-gold uppercase">
                    VISITOR SESSION TIMELINE
                  </span>
                  {selectedVisitor.is_bot ? (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30">
                      🤖 {selectedVisitor.bot_type || "Bot"}
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                      ✓ Real Human
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-text-primary font-mono mt-1">
                  {selectedVisitor.visitor_id}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Location:{" "}
                  <strong className="text-text-primary">
                    {selectedVisitor.city}, {selectedVisitor.country}
                  </strong>{" "}
                  • IP: <span className="font-mono">{selectedVisitor.ip}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedVisitor(null)}
                className="p-1 text-text-muted hover:text-white rounded bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-[#1b1b1b] border border-white/5">
                  <span className="text-[10px] text-text-muted uppercase block">Total Visits</span>
                  <span className="text-lg font-bold font-mono text-accent-gold">
                    {selectedVisitor.visit_count || 1}
                  </span>
                </div>
                <div className="p-3 bg-[#1b1b1b] border border-white/5">
                  <span className="text-[10px] text-text-muted uppercase block">Total Dwell Time</span>
                  <span className="text-lg font-bold font-mono text-text-primary">
                    {selectedVisitorData.totalTimeFormatted}
                  </span>
                </div>
                <div className="p-3 bg-[#1b1b1b] border border-white/5">
                  <span className="text-[10px] text-text-muted uppercase block">Device</span>
                  <span className="text-xs font-bold text-text-primary truncate block mt-1">
                    {selectedVisitor.device} ({selectedVisitor.os})
                  </span>
                </div>
              </div>

              {/* Sessions Timeline List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold tracking-wider uppercase text-accent-gold border-b border-white/10 pb-2">
                  Recorded Visit Sessions
                </h3>

                {selectedVisitorData.sessions.length === 0 ? (
                  <p className="text-xs text-text-muted italic">No granular session logs available.</p>
                ) : (
                  selectedVisitorData.sessions.map((sess, idx) => (
                    <div key={idx} className="p-4 bg-[#1b1b1b] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text-primary">
                          Session #{idx + 1} • {sess.durationFormatted}
                        </span>
                        <span className="text-text-muted font-mono text-[11px]">
                          {new Date(sess.startTime).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-text-muted uppercase font-semibold">
                          Pages Visited:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {sess.pages.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className="px-2 py-0.5 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/20 text-[11px] font-mono"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Interaction Events List (CTA clicks, Human verifications) */}
              {selectedVisitorData.events.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-accent-gold border-b border-white/10 pb-2">
                    Interaction Events &amp; Clicks
                  </h3>
                  <div className="space-y-2">
                    {selectedVisitorData.events.map((evt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-[#1b1b1b] border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-accent-gold" />
                          <span className="font-semibold text-text-primary">{evt.event_name}</span>
                          {evt.event_data?.label && (
                            <span className="text-text-muted font-mono text-[11px]">
                              ({evt.event_data.label})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-muted font-mono">
                          {new Date(evt.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#181818] flex justify-end">
              <button
                onClick={() => setSelectedVisitor(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-text-primary text-xs font-bold tracking-wider uppercase transition-colors"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
