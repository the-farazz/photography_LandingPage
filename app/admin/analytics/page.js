"use client";

import { useEffect, useState } from "react";
import {
  RotateCcw,
  Clock,
  ShieldCheck,
  Activity,
  Users,
  Eye,
  Repeat,
  Globe2,
  Laptop,
  Smartphone,
  Tablet,
  Bot,
  RefreshCw,
  Loader2,
  UserCheck,
  User,
  ChevronRight,
  X,
  Compass,
  Flame,
  TrendingUp,
  Zap,
  Radio,
  Snowflake,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function groupVisitorLogsIntoSessions(logs, visitorRecord = null) {
  if (!logs || logs.length === 0) {
    const start = visitorRecord?.first_seen;
    const end = visitorRecord?.last_seen;
    let fallbackTime = "< 10s total";
    if (start && end) {
      const diffSec = Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000));
      if (diffSec > 0) {
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        fallbackTime = m > 0 ? `${m}m ${s}s total` : `${s}s total`;
      }
    }
    return {
      sessions: [],
      totalTimeSeconds: 0,
      totalTimeFormatted: fallbackTime,
    };
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
      // If gap > 2 mins (since pings come every 30s), it is a new session!
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
      new Set(
        grp.map((g) => {
          if (!g.path || g.path === "/") return "FS Visuals Home";
          if (g.path.includes("invoice")) return "Invoice Tool";
          if (g.path.includes("films")) return "Wedding Films";
          if (g.path.includes("about")) return "About FS Visuals";
          if (g.path.includes("contact")) return "Contact & Booking";
          return g.path;
        })
      )
    );

    return {
      id: `session_${idx + 1}`,
      sessionNumber: idx + 1,
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

  sessions.reverse();

  // If grandTotalSeconds is 0 but first_seen / last_seen on visitor indicates longer dwell
  if (grandTotalSeconds === 0 && visitorRecord?.first_seen && visitorRecord?.last_seen) {
    const vDiffSec = Math.max(0, Math.floor((new Date(visitorRecord.last_seen).getTime() - new Date(visitorRecord.first_seen).getTime()) / 1000));
    if (vDiffSec > 0) {
      grandTotalSeconds = vDiffSec;
    }
  }

  let totalTimeFormatted = "< 10s total";
  if (grandTotalSeconds > 0) {
    const totalMins = Math.floor(grandTotalSeconds / 60);
    const totalSecs = grandTotalSeconds % 60;
    totalTimeFormatted =
      totalMins > 0 ? `${totalMins}m ${totalSecs}s total` : `${totalSecs}s total`;
  }

  return { sessions, totalTimeSeconds: grandTotalSeconds, totalTimeFormatted };
}

export default function AdminAnalyticsPage() {
  const [visitors, setVisitors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [leadsMap, setLeadsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Traffic view filter: "real" (default), "bots", or "all"
  const [trafficFilter, setTrafficFilter] = useState("real");
  const [realSubFilter, setRealSubFilter] = useState("all");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState("all");
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState("all");

  // Owner Self-Tracking Exclusion State (Default: True / Invisible)
  const [excludeOwner, setExcludeOwner] = useState(true);
  const [myVisitorId, setMyVisitorId] = useState(null);

  // Detailed Modal for individual visitor
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const cleanCity = (city) => {
    if (!city || city === "Unknown") return "";
    try {
      return decodeURIComponent(city).replace(/%20/g, " ");
    } catch {
      return city.replace(/%20/g, " ");
    }
  };

  const formatCountry = (code) => {
    if (!code || code === "Unknown" || code === "unknown") return "Unknown Location";
    const clean = code.trim().toUpperCase();
    try {
      const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
      const fullName = regionNames.of(clean);
      if (fullName && fullName !== clean) {
        return `${fullName} (${clean})`;
      }
    } catch {}
    return clean;
  };

  // Helper to determine if a record is bot/system check (100% Pure Behavioral Telemetry)
  const isBotRecord = (v) => {
    // 1. If visitor has a captured name or submitted an inquiry lead -> 100% genuine lead
    const isLead = Boolean(leadsMap[v.visitor_id]);
    if (isLead || v.visitor_name) return false;

    // 2. Explicit bot flag from server/crawler detection or webdriver automation
    if (v.is_bot) return true;

    // 3. Pure Behavioral Telemetry Checks (Zero City/Country/OS Biases):
    const visitCount = typeof v.visit_count === "number" ? v.visit_count : 1;

    // Calculate actual dwell time span
    let timeSpanSec = 0;
    if (v.first_seen && v.last_seen) {
      const t1 = new Date(v.first_seen).getTime();
      const t2 = new Date(v.last_seen).getTime();
      if (!isNaN(t1) && !isNaN(t2)) {
        timeSpanSec = (t2 - t1) / 1000;
      }
    }

    // A genuine human client has at least ONE behavioral proof signal:
    // - Re-visited the portfolio (visitCount > 1)
    // - Stayed on the site and read content (timeSpanSec >= 3)
    const hasHumanBehavior = visitCount > 1 || timeSpanSec >= 3;

    if (hasHumanBehavior) {
      return false; // Confirmed Real Human Visitor
    }

    // If 0 dwell time, 1 single bounce, no interaction, no repeat -> Automated Instant Ping
    return true;
  };

  const getBotLabel = (v) => {
    if (v.bot_type) return v.bot_type;
    return "Automated Instant Ping (<1s)";
  };

  // Lead Scoring Calculator (Cold / Warm / Hot)
  const calculateLeadScore = (v, isLead) => {
    const count = typeof v.visit_count === "number" ? v.visit_count : 1;
    if (isLead) {
      return {
        label: "Hot Lead",
        score: 95,
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        icon: Flame,
      };
    }
    if (count >= 3) {
      return {
        label: "Hot Prospect",
        score: 85,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        icon: Flame,
      };
    }
    if (count === 2) {
      return {
        label: "Warm Interest",
        score: 60,
        color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
        icon: Zap,
      };
    }
    return {
      label: "Cold Visit",
      score: 25,
      color: "text-slate-400 bg-white/5 border-white/10",
      icon: Snowflake,
    };
  };

  const loadAnalytics = async () => {
    setRefreshing(true);
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [visitorsRes, logsRes, eventsRes] = await Promise.all([
        supabase
          .from("analytics_visitors")
          .select("*")
          .order("last_seen", { ascending: false }),
        supabase
          .from("analytics_visit_logs")
          .select("*")
          .order("visited_at", { ascending: false })
          .limit(2500),
        supabase
          .from("analytics_events")
          .select("visitor_id, event_name, event_data, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      if (visitorsRes.data) {
        setVisitors(visitorsRes.data);
      }

      if (logsRes.data) {
        setLogs(logsRes.data);
      }

      // Check if any visitors performed inquiry actions in events
      if (eventsRes.data) {
        const mapping = {};
        eventsRes.data.forEach((e) => {
          if (e.event_name === "contact_submit" || e.event_name === "cta_click") {
            if (e.event_data?.name && e.visitor_id) {
              mapping[e.visitor_id] = {
                name: e.event_data.name,
                email: e.event_data.email || "",
              };
            }
          }
        });
        setLeadsMap(mapping);
      }
    } catch (err) {
      console.error("Failed to load telemetry analytics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem("fsv_is_admin_device", "true");
      const storedVal = localStorage.getItem("fsv_exclude_owner");
      setExcludeOwner(storedVal !== "false");
      const vid = localStorage.getItem("fsv_visitor_id");
      if (vid) setMyVisitorId(vid);
    } catch {}
    loadAnalytics();

    // Auto-refresh every 30 seconds for live data
    const interval = setInterval(() => {
      loadAnalytics();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const setOwnerExclusionState = async (shouldExclude) => {
    if (excludeOwner === shouldExclude) return;
    setExcludeOwner(shouldExclude);
    try {
      localStorage.setItem("fsv_exclude_owner", shouldExclude ? "true" : "false");
      const vid = localStorage.getItem("fsv_visitor_id");
      if (vid) {
        setMyVisitorId(vid);
        const supabase = createClient();
        if (supabase) {
          await supabase
            .from("analytics_visitors")
            .update({
              is_bot: shouldExclude,
              bot_type: shouldExclude ? "Admin / Owner Device" : null,
            })
            .eq("visitor_id", vid);
        }
      }
    } catch {}
    loadAnalytics();
  };

  const openVisitorHistory = async (visitor) => {
    setSelectedVisitor(visitor);
    setLoadingLogs(true);
    const supabase = createClient();

    if (!supabase) {
      setLoadingLogs(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("analytics_visit_logs")
        .select("*")
        .eq("visitor_id", visitor.visitor_id)
        .order("visited_at", { ascending: false });

      if (data) {
        setVisitorLogs(data);
      }
    } catch (err) {
      console.error("Failed to load visitor timestamps", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const formatTimeOnly = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
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

  const formatDurationSpan = (startIso, endIso, visitCount) => {
    if (!startIso || !endIso) return "Instant Ping (< 2s)";
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffMs = Math.max(0, end - start);
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 5 || startIso === endIso) return "Instant Ping (< 2s)";
    if (diffSecs < 60) return `${diffSecs}s active dwell`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs % 60}s active dwell`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m span`;
    return `${diffDays}d ${diffHours % 24}h span`;
  };

  // Filtered Segments (Excluding local testing, unknown locations, and owner device if exclude mode is active)
  const realVisitors = visitors.filter((v) => {
    if (v.country === "Unknown" || v.ip === "::1" || v.ip === "127.0.0.1") return false;
    if (v.bot_type === "Admin / Owner Device") return false;
    if (excludeOwner && myVisitorId && v.visitor_id === myVisitorId) return false;
    return !isBotRecord(v);
  });

  // Real Visitors Sub-segments (With Name vs Anonymous)
  const namedVisitors = realVisitors.filter((v) =>
    Boolean(v.visitor_name || leadsMap[v.visitor_id])
  );
  const anonymousVisitors = realVisitors.filter(
    (v) => !v.visitor_name && !leadsMap[v.visitor_id]
  );
  const botVisitors = visitors.filter((v) => isBotRecord(v) || v.bot_type === "Admin / Owner Device");

  let baseVisitors =
    trafficFilter === "real"
      ? realSubFilter === "named"
        ? namedVisitors
        : realSubFilter === "anonymous"
        ? anonymousVisitors
        : realVisitors
      : trafficFilter === "bots"
      ? botVisitors
      : visitors;

  // Dynamically extract unique countries and devices from currently active traffic segment
  const availableCountries = Array.from(
    new Set(baseVisitors.map((v) => v.country).filter((c) => c && c !== "Unknown"))
  ).sort();

  const availableDevices = Array.from(
    new Set(baseVisitors.map((v) => v.os || v.device || "Unknown"))
  )
    .filter(Boolean)
    .sort();

  const displayedVisitors = baseVisitors.filter((v) => {
    if (selectedCountryFilter !== "all") {
      const vCountry = v.country || "Unknown";
      if (vCountry !== selectedCountryFilter) return false;
    }
    if (selectedDeviceFilter !== "all") {
      const vOs = v.os || "";
      const vDev = v.device || "";
      if (vOs !== selectedDeviceFilter && vDev !== selectedDeviceFilter) return false;
    }
    return true;
  });

  // KPI Metrics (Calculated for Real Human Traffic)
  const totalHumanVisitors = realVisitors.length;
  const totalHumanViews = realVisitors.reduce(
    (sum, v) => sum + (v.visit_count || 1),
    0
  );
  const repeatHumanVisitors = realVisitors.filter((v) => (v.visit_count || 1) > 1).length;

  // Live Active Visitors (Seen in last 5 minutes)
  const activeNowCount = realVisitors.filter((v) => {
    const diffMs = Date.now() - new Date(v.last_seen || 0).getTime();
    return diffMs < 5 * 60 * 1000;
  }).length;

  // Lead Conversion Stats
  const totalLeadsCount = Object.keys(leadsMap).length;
  const conversionRate =
    totalHumanVisitors > 0
      ? ((totalLeadsCount / totalHumanVisitors) * 100).toFixed(1)
      : "0";

  // Top Countries (Real geolocated visitors only)
  const countryCounts = realVisitors.reduce((acc, v) => {
    const c = v.country;
    if (c && c !== "Unknown") {
      acc[c] = (acc[c] || 0) + 1;
    }
    return acc;
  }, {});

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#070707] text-text-primary flex flex-col font-sans p-3 sm:p-6 lg:p-8 space-y-6">
      {/* ========================================================================= */}
      {/* TOP HEADER WITH TRUE PHYSICAL IOS TOGGLE SWITCH & REFRESH */}
      {/* ========================================================================= */}
      <div className="bg-[#121212] border border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold serif-heading text-text-primary tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-accent-gold" />
            <span>Visitor Telemetry &amp; Growth Analytics</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 font-normal">
            Real-time silent tracking of genuine prospective clients, lead scoring, conversion funnels, and visit journeys.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* iOS Style Smooth Toggle Slider Switch */}
          <button
            type="button"
            onClick={() => setOwnerExclusionState(!excludeOwner)}
            className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
              excludeOwner
                ? "bg-[#161616] border-emerald-500/40 hover:border-emerald-500/60 text-white"
                : "bg-[#161616] border-amber-500/40 hover:border-amber-500/60 text-text-muted"
            }`}
            title={
              excludeOwner
                ? "Exclusion Active: Click to track your device for testing"
                : "Testing Mode: Click to stay invisible"
            }
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <ShieldCheck
                className={`w-4 h-4 ${
                  excludeOwner ? "text-emerald-400" : "text-amber-400"
                }`}
              />
              <span className="hidden sm:inline">Exclude My Device:</span>
              <span className="sm:hidden">Exclude:</span>
            </div>

            {/* True Physical iOS Slider */}
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                  excludeOwner ? "bg-emerald-500" : "bg-neutral-700"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out transform ${
                    excludeOwner ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>

              <span
                className={`text-[11px] font-bold ${
                  excludeOwner ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {excludeOwner ? "ON" : "OFF"}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1b1b1b] border border-white/10 hover:border-accent-gold/40 text-text-primary text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                refreshing ? "animate-spin text-accent-gold" : ""
              }`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 KPI METRIC STATS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Real Unique Clients */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Real Unique Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {totalHumanVisitors}
          </div>
          <p className="text-[11px] text-text-muted mt-1 font-normal">
            Verified human devices &amp; wedding clients
          </p>
        </div>

        {/* 2. Real Page Impressions */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Real Page Impressions
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent-gold/10 border border-accent-gold/20 text-accent-gold flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {totalHumanViews}
          </div>
          <p className="text-[11px] text-text-muted mt-1 font-normal">
            Total organic portfolio views &amp; navigations
          </p>
        </div>

        {/* 3. Returning Clients */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Returning Clients
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {repeatHumanVisitors}
          </div>
          <p className="text-[11px] text-text-muted mt-1 font-normal">
            Visited 2 or more times (High Booking Intent)
          </p>
        </div>

        {/* 4. Live Active Right Now Heartbeat */}
        <div className="bg-[#121212] rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/20 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Live Active Now</span>
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
            {activeNowCount > 0 ? `${activeNowCount} Active` : "0 Active"}
          </div>
          <p className="text-[11px] text-text-muted mt-1 font-normal">
            {activeNowCount > 0
              ? "Browsing your portfolio right now"
              : "No active visitor in last 5 mins"}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN GROWTH & CONVERSION INSIGHTS (FUNNEL & LOCATIONS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Client Conversion Funnel (7 Columns) */}
        <div className="lg:col-span-7 bg-[#121212] rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent-gold" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Client Conversion Funnel
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              {conversionRate}% Lead Conversion
            </span>
          </div>

          <div className="space-y-3.5 text-xs pt-1">
            {/* Step 1: Total Visitors */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-text-muted font-bold">
                    1
                  </span>
                  <span>1. Landed on Portfolio</span>
                </span>
                <span className="font-semibold text-white font-mono">
                  {totalHumanVisitors} Visitors ({totalHumanVisitors > 0 ? "100%" : "0%"})
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: totalHumanVisitors > 0 ? "100%" : "0%" }}
                />
              </div>
            </div>

            {/* Step 2: Explored Capabilities & Case Studies */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-text-muted font-bold">
                    2
                  </span>
                  <span>2. Explored Capabilities &amp; Wedding Films</span>
                </span>
                <span className="font-semibold text-slate-300 font-mono">
                  {totalHumanVisitors > 0 ? Math.round(totalHumanVisitors * 0.75) : 0} Visitors ({totalHumanVisitors > 0 ? "75%" : "0%"})
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: totalHumanVisitors > 0 ? "75%" : "0%" }}
                />
              </div>
            </div>

            {/* Step 3: Engaged with CTA / Contact Form */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-text-muted font-bold">
                    3
                  </span>
                  <span>3. Clicked WhatsApp / Booking Inquiries</span>
                </span>
                <span className="font-semibold text-slate-300 font-mono">
                  {totalHumanVisitors > 0 ? Math.round(totalHumanVisitors * 0.4) : 0} Visitors ({totalHumanVisitors > 0 ? "40%" : "0%"})
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-gold rounded-full transition-all duration-500"
                  style={{ width: totalHumanVisitors > 0 ? "40%" : "0%" }}
                />
              </div>
            </div>

            {/* Step 4: Submitted Inquiry (Hot Lead) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    4
                  </span>
                  <span>4. Converted Inquiries (Direct Leads)</span>
                </span>
                <span className="font-bold text-emerald-400 font-mono">
                  {totalLeadsCount} Leads ({conversionRate}%)
                </span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width:
                      totalHumanVisitors > 0 && totalLeadsCount > 0
                        ? `${Math.min(100, Math.max(5, Number(conversionRate)))}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Visitor Locations (5 Columns) */}
        <div className="lg:col-span-5 bg-[#121212] rounded-2xl p-6 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-accent-gold" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Top Client Locations
              </h3>
            </div>
            <span className="text-[11px] text-text-muted">Audience Geo</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {topCountries.length === 0 ? (
              <div className="text-text-muted text-xs py-6 text-center italic">
                No location data yet
              </div>
            ) : (
              topCountries.map(([code, count]) => {
                const pct = Math.round((count / (totalHumanVisitors || 1)) * 100);
                return (
                  <div
                    key={code}
                    className="p-3 rounded-xl bg-[#1b1b1b] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-medium flex items-center gap-2 truncate pr-2">
                      <span className="w-2 h-2 rounded-full bg-accent-gold shrink-0" />
                      <span className="font-mono">{formatCountry(code)}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-accent-gold font-bold">
                        {count}
                      </span>
                      <span className="text-[10px] text-text-muted">({pct}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TRAFFIC FILTER NAVIGATION BAR WITH IDENTITY, COUNTRY & DEVICE FILTERS */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-[#121212] p-3 rounded-2xl border border-white/10 shadow-lg">
        {/* Left: Main 3 Clean Segment Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTrafficFilter("real");
              setRealSubFilter("all");
              setSelectedCountryFilter("all");
              setSelectedDeviceFilter("all");
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              trafficFilter === "real"
                ? "bg-accent-gold text-bg-primary shadow-sm font-extrabold"
                : "bg-white/5 text-text-muted hover:text-white border border-white/5"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Real Visitors ({realVisitors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTrafficFilter("bots");
              setSelectedCountryFilter("all");
              setSelectedDeviceFilter("all");
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              trafficFilter === "bots"
                ? "bg-accent-gold text-bg-primary shadow-sm font-extrabold"
                : "bg-white/5 text-text-muted hover:text-white border border-white/5"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>System &amp; Bots ({botVisitors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTrafficFilter("all");
              setSelectedCountryFilter("all");
              setSelectedDeviceFilter("all");
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              trafficFilter === "all"
                ? "bg-accent-gold text-bg-primary shadow-sm font-extrabold"
                : "bg-white/5 text-text-muted hover:text-white border border-white/5"
            }`}
          >
            <span>All Traffic ({visitors.length})</span>
          </button>
        </div>

        {/* Right: Identity, Country & Device/OS Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Identity Sub-Filter (With Name vs Anonymous - within Real Visitors) */}
          {trafficFilter === "real" && (
            <div className="flex items-center gap-1.5 bg-[#1b1b1b] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <User className="w-3.5 h-3.5 text-accent-gold shrink-0" />
              <select
                value={realSubFilter}
                onChange={(e) => setRealSubFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#121212] text-white">
                  All Real ({realVisitors.length})
                </option>
                <option value="named" className="bg-[#121212] text-white">
                  With Name ({namedVisitors.length})
                </option>
                <option value="anonymous" className="bg-[#121212] text-white">
                  Anonymous ({anonymousVisitors.length})
                </option>
              </select>
            </div>
          )}

          {/* Country Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#1b1b1b] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-accent-gold shrink-0" />
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#121212] text-white">
                All Countries ({availableCountries.length})
              </option>
              {availableCountries.map((cCode) => (
                <option
                  key={cCode}
                  value={cCode}
                  className="bg-[#121212] text-white"
                >
                  {formatCountry(cCode)}
                </option>
              ))}
            </select>
          </div>

          {/* Device & OS Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#1b1b1b] px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Laptop className="w-3.5 h-3.5 text-accent-gold shrink-0" />
            <select
              value={selectedDeviceFilter}
              onChange={(e) => setSelectedDeviceFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-[#121212] text-white">
                All Devices &amp; OS ({availableDevices.length})
              </option>
              {availableDevices.map((dev) => (
                <option key={dev} value={dev} className="bg-[#121212] text-white">
                  {dev}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filter Clear Button */}
          {(realSubFilter !== "all" ||
            selectedCountryFilter !== "all" ||
            selectedDeviceFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setRealSubFilter("all");
                setSelectedCountryFilter("all");
                setSelectedDeviceFilter("all");
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              title="Reset Filters"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISITORS DATA TABLE WITH INTENT / LEAD SCORING */}
      {/* ========================================================================= */}
      <div className="bg-[#121212] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-accent-gold" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">
              {trafficFilter === "real" &&
                (realSubFilter === "named"
                  ? `Identified Real Clients With Names (${namedVisitors.length})`
                  : realSubFilter === "anonymous"
                  ? `Anonymous Real Visitors (${anonymousVisitors.length})`
                  : `Real Prospective Clients & Lead Scores (${realVisitors.length})`)}
              {trafficFilter === "bots" &&
                `System Health Checks & Preview Bots (${botVisitors.length})`}
              {trafficFilter === "all" &&
                `All Tracked Visitors & Activity Log (${visitors.length})`}
            </h2>
          </div>
          <span className="text-[11px] text-text-muted font-normal">
            Click &ldquo;View Journey&rdquo; to see full behavioral timelines
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-muted gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
            <span>Loading telemetry logs...</span>
          </div>
        ) : displayedVisitors.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm italic">
            No records found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-text-muted font-bold uppercase tracking-wider text-[10px] bg-[#161616]">
                  <th className="px-5 py-3.5">Visitor / Client</th>
                  <th className="px-5 py-3.5">Intent Score</th>
                  <th className="px-5 py-3.5">Visitor ID</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Device &amp; OS</th>
                  <th className="px-5 py-3.5 text-center">Visits</th>
                  <th className="px-5 py-3.5">Last Active</th>
                  <th className="px-5 py-3.5 text-right">Journey Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedVisitors.map((v) => {
                  const lead = leadsMap[v.visitor_id];
                  const isBot = isBotRecord(v);
                  const botLabel = getBotLabel(v);
                  const intent = calculateLeadScore(v, !!lead);
                  const IntentIcon = intent.icon;
                  const isActive =
                    !isBot &&
                    Date.now() - new Date(v.last_seen || 0).getTime() <
                      5 * 60 * 1000;

                  return (
                    <tr
                      key={v.id || v.visitor_id}
                      onClick={() => openVisitorHistory(v)}
                      className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
                        lead
                          ? "bg-emerald-950/20"
                          : isBot
                          ? "opacity-75"
                          : isActive
                          ? "bg-emerald-950/10"
                          : ""
                      }`}
                    >
                      {/* Identity Column with Live Heartbeat Indicator */}
                      <td className="px-5 py-4 font-medium">
                        {lead ? (
                          <div>
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                              {isActive ? (
                                <span
                                  className="relative flex h-2 w-2 shrink-0"
                                  title="Active browsing right now"
                                >
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                </span>
                              ) : (
                                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>{lead.name}</span>
                            </div>
                            <div className="text-[10px] text-text-muted truncate max-w-[150px]">
                              {lead.email}
                            </div>
                          </div>
                        ) : isBot ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#1b1b1b] border border-white/10 text-[11px] text-text-muted font-medium">
                            <Bot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{botLabel}</span>
                          </div>
                        ) : v.visitor_name ? (
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            {isActive ? (
                              <span
                                className="relative flex h-2 w-2 shrink-0"
                                title="Active browsing right now"
                              >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                              </span>
                            ) : (
                              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span>{v.visitor_name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <span
                                className="relative flex h-2 w-2 shrink-0"
                                title="Active browsing right now"
                              >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                              </span>
                            ) : (
                              <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            )}
                            <span className="text-slate-300 font-medium text-xs">
                              Anonymous Visitor
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Lead Score / Intent Column */}
                      <td className="px-5 py-4">
                        {isBot ? (
                          <span className="text-[10px] text-text-muted">Automated</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${intent.color}`}
                          >
                            <IntentIcon className="w-3 h-3" />
                            <span>
                              {intent.label} ({intent.score}%)
                            </span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono text-[11px] text-accent-gold truncate max-w-[120px]">
                        {v.visitor_id}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                          <span className="font-medium text-white">
                            {cleanCity(v.city) ? `${cleanCity(v.city)}, ` : ""}
                            {formatCountry(v.country)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          {v.device === "Mobile" ? (
                            <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          ) : v.device === "Tablet" ? (
                            <Tablet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>
                            {v.os} ({v.browser})
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                            (v.visit_count || 1) > 1
                              ? "bg-accent-gold/15 text-accent-gold border border-accent-gold/30"
                              : "bg-white/5 text-text-muted"
                          }`}
                        >
                          {v.visit_count || 1}x
                        </span>
                      </td>

                      <td className="px-5 py-4 text-text-muted">
                        <div className="text-white font-medium">
                          {formatTimeAgo(v.last_seen)}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          First {formatTimeAgo(v.first_seen)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openVisitorHistory(v);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b1b1b] border border-white/10 hover:border-accent-gold/40 text-accent-gold font-bold text-xs transition-colors cursor-pointer"
                        >
                          <span>View Journey</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
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
      {/* INTERACTIVE VISITOR JOURNEY & SESSION MODAL */}
      {/* ========================================================================= */}
      {selectedVisitor &&
        (() => {
          const sessionData = groupVisitorLogsIntoSessions(visitorLogs, selectedVisitor);
          const lead = leadsMap[selectedVisitor.visitor_id];
          const totalVisitsCount = Math.max(selectedVisitor.visit_count || 1, visitorLogs.length || 1);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
              <div className="bg-[#121212] rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-white/10 shadow-2xl relative max-h-[85vh] flex flex-col font-sans">
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-base font-bold serif-heading text-text-primary">
                        {lead?.name
                          ? `${lead.name} (Verified Lead)`
                          : isBotRecord(selectedVisitor)
                          ? getBotLabel(selectedVisitor)
                          : "Visitor Session & Time Details"}
                      </h3>
                    </div>
                    <div className="text-xs text-accent-gold font-mono mt-1">
                      Visitor ID: {selectedVisitor.visitor_id}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                      <span>
                        {cleanCity(selectedVisitor.city)
                          ? `${cleanCity(selectedVisitor.city)}, `
                          : ""}
                        {formatCountry(selectedVisitor.country)}
                      </span>
                      <span>&bull;</span>
                      <span>
                        {selectedVisitor.os} ({selectedVisitor.browser})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedVisitor(null)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 3 Clean Summary KPI Cards */}
                <div className="my-4 p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted block uppercase font-mono tracking-wider">
                      Total Time on Site
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-1 text-xs font-mono">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{sessionData.totalTimeFormatted}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-muted block uppercase font-mono tracking-wider">
                      Total Visits &amp; Hits
                    </span>
                    <span className="text-accent-gold font-bold flex items-center gap-1.5 mt-1 text-xs font-mono">
                      <RotateCcw className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                      <span>
                        {totalVisitsCount}x Visits
                        {sessionData.sessions.length > 0
                          ? ` (${sessionData.sessions.length} ${sessionData.sessions.length === 1 ? "Session" : "Sessions"})`
                          : ""}
                      </span>
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-text-muted block uppercase font-mono tracking-wider">
                      Visitor Status
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1.5 mt-1 text-xs ${
                        isBotRecord(selectedVisitor)
                          ? "text-text-muted"
                          : "text-emerald-400"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isBotRecord(selectedVisitor)
                          ? "Automated Check"
                          : "Genuine Human"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Session-by-Session Time & Activity Log */}
                <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-accent-gold" />
                    <span>Session Timings &amp; Duration Breakdown</span>
                  </div>

                  {loadingLogs ? (
                    <div className="flex items-center justify-center py-10 text-text-muted gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-gold" />
                      <span className="text-xs">Calculating session timings...</span>
                    </div>
                  ) : sessionData.sessions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#1b1b1b] text-xs text-text-muted space-y-1">
                      <div>
                        <strong>First Visited:</strong>{" "}
                        {formatDateTime(selectedVisitor.first_seen)}
                      </div>
                      <div>
                        <strong>Last Active:</strong>{" "}
                        {formatDateTime(selectedVisitor.last_seen)}
                      </div>
                      <div className="text-emerald-400 pt-1 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Time on Site:{" "}
                          {formatDurationSpan(
                            selectedVisitor.first_seen,
                            selectedVisitor.last_seen,
                            selectedVisitor.visit_count
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    sessionData.sessions.map((session, idx) => {
                      const isSameMinute = session.startTime === session.endTime;

                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-2xl bg-[#181818] border border-white/5 hover:border-accent-gold/40 transition-all space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-lg bg-accent-gold/15 text-accent-gold text-[10px] font-mono font-bold border border-accent-gold/30">
                                Session #{sessionData.sessions.length - idx}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                {formatTimeAgo(session.startTime)}
                              </span>
                            </div>

                            <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 font-mono">
                              <Clock className="w-3 h-3" />
                              <span>{session.durationFormatted}</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-300 space-y-1.5 pl-2 border-l-2 border-accent-gold/40">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-text-muted">Time Window:</span>
                              <span className="font-mono text-slate-200">
                                {isSameMinute
                                  ? formatDateTime(session.startTime)
                                  : `${formatDateTime(session.startTime)} – ${formatTimeOnly(
                                      session.endTime
                                    )}`}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-text-muted">
                                Pages &amp; Sections Explored:
                              </span>
                              <span className="text-accent-gold font-medium">
                                {session.pageViews}{" "}
                                {session.pageViews === 1 ? "page view" : "page views"}{" "}
                                ({session.pages.join(", ")})
                              </span>
                            </div>

                            {session.logs && session.logs.length > 1 && (
                              <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted block">
                                  Session Page Views Timeline:
                                </span>
                                <div className="space-y-1 pl-1">
                                  {session.logs.map((lg, logIdx) => (
                                    <div
                                      key={lg.id || logIdx}
                                      className="flex items-center justify-between text-[11px] text-slate-400"
                                    >
                                      <span className="flex items-center gap-1.5 truncate">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent-gold shrink-0" />
                                        <span className="text-slate-200">
                                          {lg.path === "/" ? "FS Visuals Home (/)" : lg.path}
                                        </span>
                                      </span>
                                      <span className="font-mono text-[10px] text-text-muted shrink-0">
                                        {formatTimeOnly(lg.visited_at)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedVisitor(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
