"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  RotateCcw,
  ArrowLeft,
  Check,
  Copy,
  Image as ImageIcon,
  Loader2,
  Camera,
  Film,
  Compass,
  BookOpen,
  Eye,
  EyeOff,
  Sliders,
  Lock,
  User,
  Mail,
  LogOut,
  ShieldCheck,
  Activity,
  FileText,
  Calendar,
  Plus,
  ChevronDown,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import InvoiceDocument from "@/components/admin/InvoiceDocument";
import { createClient } from "@/lib/supabase/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AdminInvoicePage() {
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr + "T00:00:00");
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatDateToLong = (dateObj) => {
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString("en-US", { month: "long" });
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const generateRandomClientId = () => {
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(10 + Math.random() * 990)).padStart(3, "0");
    return `CLI-${year}-${randomNum}`;
  };

  const generateRandomInvoiceNo = () => {
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(1 + Math.random() * 9999)).padStart(4, "0");
    return `INV-${year}-${randomNum}`;
  };

  // Multi-select services state (with Album)
  const [services, setServices] = useState({
    photography: true,
    videography: false,
    drone: false,
    album: false,
  });

  // Mobile active tab: 'editor' | 'preview'
  const [mobileTab, setMobileTab] = useState("editor");

  const [formData, setFormData] = useState({
    clientName: "",
    clientId: "CLI-2026-089",
    invoiceNo: "INV-2026-0042",
    rawDate: "2026-10-16",
    invoiceDate: "October 16, 2026",
    dueDate: "Upon Receipt",
    serviceName: "Photography Services",
    duration: "",
    eventDates: [],
    eventDate: "",
    description: "High-resolution fine-art photography & candid coverage",
    totalAmount: 20000,
    paidAmount: 0,
    status: "UNPAID",
    notes: "",
  });

  // Initialize random client ID and current date safely on client mount
  useEffect(() => {
    const now = new Date();
    setFormData((prev) => ({
      ...prev,
      clientId: generateRandomClientId(),
      invoiceNo: generateRandomInvoiceNo(),
      rawDate: now.toISOString().split("T")[0],
      invoiceDate: formatDateToLong(now),
    }));
  }, []);

  const computeServiceTitleAndDesc = (serviceState, duration) => {
    const { photography, videography, drone, album } = serviceState;
    const durClean = duration && duration.trim() ? duration.trim() : "";
    const durSuffix = durClean ? ` (${durClean})` : "";

    // Build Title
    const titleParts = [];
    if (photography) titleParts.push("Photography");
    if (videography) titleParts.push("Videography");
    if (drone) titleParts.push("Drone");
    if (album) titleParts.push("Album");

    let title = "Photography Services";
    if (titleParts.length === 1) {
      title = `${titleParts[0]} Services`;
    } else if (titleParts.length === 2) {
      title = `${titleParts[0]} & ${titleParts[1]} Services`;
    } else if (titleParts.length > 2) {
      title = `${titleParts.slice(0, -1).join(", ")} & ${titleParts[titleParts.length - 1]} Services`;
    }

    // Build Description
    let desc = `Complete event coverage${durSuffix}`;
    if (photography && !videography && !drone && !album) {
      desc = `High-resolution fine-art photography & candid coverage${durSuffix}`;
    } else if (photography && videography && !drone && !album) {
      desc = `Complete photography & cinematic video production${durSuffix}`;
    } else if (photography && videography && drone && !album) {
      desc = `Complete photography, cinematic video production & aerial drone coverage${durSuffix}`;
    } else if (photography && videography && !drone && album) {
      desc = `Complete photography, cinematic video production & luxury photo album${durSuffix}`;
    } else if (photography && videography && drone && album) {
      desc = `Complete photography, cinematic video production, aerial drone & luxury photo album${durSuffix}`;
    } else if (photography && !videography && drone && !album) {
      desc = `High-resolution fine-art photography & aerial drone coverage${durSuffix}`;
    } else if (photography && !videography && !drone && album) {
      desc = `High-resolution fine-art photography & luxury printed photo album${durSuffix}`;
    } else if (photography && !videography && drone && album) {
      desc = `Fine-art photography, aerial drone coverage & luxury printed photo album${durSuffix}`;
    } else if (!photography && videography && !drone && !album) {
      desc = `On-location video production & cinematic coverage${durSuffix}`;
    } else if (!photography && videography && drone && !album) {
      desc = `Cinematic video production & aerial drone coverage${durSuffix}`;
    } else if (!photography && videography && !drone && album) {
      desc = `Cinematic video production & highlight photo album${durSuffix}`;
    } else if (!photography && videography && drone && album) {
      desc = `Cinematic video production, aerial drone coverage & highlight photo album${durSuffix}`;
    } else if (!photography && !videography && drone && !album) {
      desc = `Aerial drone footage & venue cinematography${durSuffix}`;
    } else if (!photography && !videography && drone && album) {
      desc = `Aerial drone cinematography & custom printed photo album${durSuffix}`;
    } else if (!photography && !videography && !drone && album) {
      desc = `Custom designed luxury handmade photo album${durSuffix}`;
    }

    return { title, desc };
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncingEvent, setSyncingEvent] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveInvoice = async (silent = false) => {
    const cName = formData.clientName && formData.clientName.trim();
    if (!cName) {
      if (!silent) showToast("Please enter Client Name before saving.", "error");
      return;
    }
    const totalNum = Number(formData.totalAmount || 0);
    if (totalNum <= 0) {
      if (!silent) showToast("Please enter a valid Total Project Amount.", "error");
      return;
    }

    try {
      setSyncingEvent(true);
      const paidNum = Number(formData.paidAmount || 0);
      const remNum = Math.max(0, totalNum - paidNum);
      const computedStatus = paidNum <= 0 ? "UNPAID" : remNum <= 0 ? "FULLY PAID" : "PARTIALLY PAID";

      const validDates = Array.isArray(formData.eventDates)
        ? formData.eventDates.filter((d) => d && typeof d === "string" && d.trim())
        : [];
      const primaryDate = validDates[0] || formData.rawDate || new Date().toISOString().split("T")[0];
      const datesTag = validDates.length > 0 ? `[DATES:${validDates.join(",")}] ` : "";
      const durTag = formData.duration ? `Duration: ${formData.duration} | ` : "";

      const payload = {
        client_name: cName,
        client_phone: "",
        event_title: formData.serviceName || "Photography Services",
        event_date: primaryDate,
        event_location: "Karachi, Pakistan",
        service_type: formData.serviceName,
        total_amount: totalNum,
        paid_amount: paidNum,
        remaining_amount: remNum,
        status: computedStatus,
        invoice_no: formData.invoiceNo,
        notes: `${datesTag}${durTag}${formData.description || formData.notes || ""}`,
      };

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));

      // Immediately update local cache so /admin/events shows it instantly
      try {
        const local = localStorage.getItem("fsv_cached_events");
        const list = local ? JSON.parse(local) : [];
        const cleanList = list.filter((e) => e.invoice_no !== formData.invoiceNo);
        const savedEvt = resData?.event || {
          id: `evt_inv_${Date.now()}`,
          ...payload,
          event_payments: paidNum > 0 ? [
            {
              id: `pay_inv_${Date.now()}`,
              amount: paidNum,
              payment_date: payload.event_date,
              payment_method: "Cash / Advance",
              notes: "Initial Advance from Invoice",
            }
          ] : [],
        };
        localStorage.setItem("fsv_cached_events", JSON.stringify([savedEvt, ...cleanList]));
      } catch {}

      setSyncedSuccess(true);
      if (!silent) {
        showToast(`Invoice ${formData.invoiceNo} saved to Event Budget!`, "success");
      }
      setTimeout(() => setSyncedSuccess(false), 3500);
    } catch (err) {
      console.warn("Event budget save notice:", err);
      if (!silent) {
        showToast("Failed to save invoice. Please try again.", "error");
      }
    } finally {
      setSyncingEvent(false);
    }
  };

  const handleSyncToEventTracker = (silent = true) => handleSaveInvoice(silent);

  // Toggle multi-select service options
  const handleToggleService = (key) => {
    const nextServices = { ...services, [key]: !services[key] };
    
    // Ensure at least one service remains checked
    if (!nextServices.photography && !nextServices.videography && !nextServices.drone && !nextServices.album) {
      return;
    }

    setServices(nextServices);
    const computed = computeServiceTitleAndDesc(nextServices, formData.duration);
    setFormData((prev) => ({
      ...prev,
      serviceName: computed.title,
      description: computed.desc,
    }));
  };

  const handleDurationChange = (rawVal) => {
    let formatted = rawVal;
    const trimmed = (rawVal || "").trim();
    let numDays = 0;

    const match = trimmed.match(/^(\d+)/);
    if (match) {
      numDays = parseInt(match[1], 10);
      formatted = numDays === 1 ? "1 Day" : `${numDays} Days`;
    } else if (!trimmed) {
      formatted = "";
      numDays = 0;
    }

    let nextDates = [...(formData.eventDates || [])];
    if (numDays > nextDates.length) {
      while (nextDates.length < numDays) {
        nextDates.push("");
      }
    } else if (numDays < nextDates.length) {
      nextDates = nextDates.slice(0, numDays);
    }

    const computed = computeServiceTitleAndDesc(services, formatted);
    setFormData((prev) => ({
      ...prev,
      duration: formatted,
      eventDates: nextDates,
      description: computed.desc,
    }));
  };

  const handleEventDateChange = (index, dateVal) => {
    const nextDates = [...(formData.eventDates || [])];
    nextDates[index] = dateVal;
    setFormData((prev) => ({
      ...prev,
      eventDates: nextDates,
    }));
  };

  const handleAddDay = () => {
    const currentNum = (formData.eventDates || []).length || (formData.duration ? parseInt(formData.duration, 10) || 0 : 0);
    const newNum = currentNum + 1;
    handleDurationChange(`${newNum} Days`);
  };

  const handleStatusChange = (newStatus) => {
    let newPaid = formData.paidAmount;
    if (newStatus === "UNPAID") {
      newPaid = 0;
    } else if (newStatus === "PAID") {
      newPaid = formData.totalAmount;
    } else if (newStatus === "PARTIALLY PAID") {
      if (newPaid <= 0 || newPaid >= formData.totalAmount) {
        newPaid = Math.round(formData.totalAmount / 2);
      }
    }

    setFormData((prev) => ({
      ...prev,
      status: newStatus,
      paidAmount: newPaid,
    }));
  };

  const handleTotalAmountChange = (val) => {
    const total = Math.max(0, Number(val) || 0);
    let autoStatus = formData.status;
    if (formData.paidAmount <= 0) {
      autoStatus = "UNPAID";
    } else if (formData.paidAmount >= total && total > 0) {
      autoStatus = "PAID";
    } else {
      autoStatus = "PARTIALLY PAID";
    }

    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
      status: autoStatus,
    }));
  };

  const handlePaidAmountChange = (val) => {
    const paid = Math.max(0, Number(val) || 0);
    let autoStatus = formData.status;
    if (paid <= 0) {
      autoStatus = "UNPAID";
    } else if (paid >= formData.totalAmount && formData.totalAmount > 0) {
      autoStatus = "PAID";
    } else {
      autoStatus = "PARTIALLY PAID";
    }

    setFormData((prev) => ({
      ...prev,
      paidAmount: paid,
      status: autoStatus,
    }));
  };

  const handleDateChange = (e) => {
    const rawVal = e.target.value;
    if (!rawVal) return;
    const d = new Date(rawVal + "T00:00:00");
    setFormData((prev) => ({
      ...prev,
      rawDate: rawVal,
      invoiceDate: formatDateToLong(d),
    }));
  };

  const handleResetSample = () => {
    const now = new Date();
    const defaultServices = { photography: true, videography: false, drone: false, album: false };
    const computed = computeServiceTitleAndDesc(defaultServices, "");

    setServices(defaultServices);
    setFormData({
      clientName: "",
      clientId: generateRandomClientId(),
      invoiceNo: generateRandomInvoiceNo(),
      rawDate: now.toISOString().split("T")[0],
      invoiceDate: formatDateToLong(now),
      dueDate: "Upon Receipt",
      serviceName: computed.title,
      duration: "",
      eventDates: [],
      eventDate: "",
      description: computed.desc,
      totalAmount: 20000,
      paidAmount: 0,
      status: "UNPAID",
      notes: "",
    });
  };

  const remainingBalance = Math.max(
    0,
    Number(formData.totalAmount || 0) - Number(formData.paidAmount || 0)
  );

  // 1-Click Direct Download as PDF (Rock-solid across Mobile and PC)
  const handleDownloadPDF = async () => {
    const element =
      document.getElementById("printable-invoice-export") ||
      document.getElementById("printable-invoice-preview") ||
      document.getElementById("printable-invoice");
    if (!element) {
      alert("Invoice element not found. Please try again.");
      return;
    }

    try {
      setDownloadingPdf(true);
      // Automatically sync invoice details to Event Budget Tracker
      handleSyncToEventTracker(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;

      let renderWidth = pdfWidth;
      let renderHeight = pdfWidth / ratio;

      if (renderHeight > pdfHeight) {
        renderHeight = pdfHeight;
        renderWidth = pdfHeight * ratio;
      }

      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = (pdfHeight - renderHeight) / 2;

      pdf.addImage(imgData, "JPEG", xOffset, yOffset, renderWidth, renderHeight);
      const filename = `${formData.invoiceNo || "Invoice"}_${formData.clientName || "Client"}.pdf`.replace(/\s+/g, "_");

      // Robust Blob Download trigger for Mobile (iOS Safari / Chrome) and PC
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 2500);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 1-Click Direct Download as High-Res Image (PNG) (Mobile & PC compatible via Blob)
  const handleDownloadPNG = async () => {
    const element =
      document.getElementById("printable-invoice-export") ||
      document.getElementById("printable-invoice-preview") ||
      document.getElementById("printable-invoice");
    if (!element) {
      alert("Invoice element not found. Please try again.");
      return;
    }

    try {
      setDownloadingPng(true);
      // Automatically sync invoice details to Event Budget Tracker
      handleSyncToEventTracker(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 800,
      });

      const filename = `${formData.invoiceNo || "Invoice"}_${formData.clientName || "Client"}.png`.replace(/\s+/g, "_");

      canvas.toBlob((blob) => {
        if (!blob) {
          setDownloadingPng(false);
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          setDownloadingPng(false);
        }, 2500);
      }, "image/png");
    } catch (err) {
      console.error("Image generation error:", err);
      alert("Error saving image. Please try again.");
      setDownloadingPng(false);
    }
  };

  // Copy WhatsApp summary message
  const handleCopyWhatsAppSummary = () => {
    const displayEvtDate = formData.eventDate && formData.eventDate.trim() ? formData.eventDate.trim() : formData.invoiceDate;
    const summaryText = `*FS VISUALS - INVOICE DETAILS*
━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${formData.invoiceNo}
👤 *Client Name:* ${formData.clientName || "Client"} (${formData.clientId})
📅 *Date:* ${formData.invoiceDate}
🎬 *Service:* ${formData.serviceName}
🗓️ *Total Days:* ${formData.duration || "1 Day"}${displayEvtDate ? ` (${displayEvtDate})` : ""}
💰 *Total Amount:* PKR ${Number(formData.totalAmount).toLocaleString()}
✅ *Advance Paid:* PKR ${Number(formData.paidAmount).toLocaleString()}
⏳ *Remaining Balance:* PKR ${Number(remainingBalance).toLocaleString()}
📌 *Status:* ${formData.status}
━━━━━━━━━━━━━━━━━━━━
_“Aap ki yaadon ka cinematic safar.”_
FS Visuals Karachi | +92 327 3129464`;

    navigator.clipboard.writeText(summaryText);
    // Automatically sync invoice details to Event Budget Tracker
    handleSyncToEventTracker(true);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-text-primary flex flex-col font-sans">
      {/* Dedicated Offscreen Render Target for 100% Reliable PDF & Image Export across Mobile & PC */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0px",
          width: "800px",
          minWidth: "800px",
          maxWidth: "800px",
          zIndex: -9999,
          pointerEvents: "none",
          opacity: 1,
          visibility: "visible",
        }}
        aria-hidden="true"
      >
        <InvoiceDocument data={formData} id="printable-invoice-export" />
      </div>

      {/* Top Invoice Action Header */}
      <header className="bg-[#111111] border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 shadow-lg lg:sticky lg:top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
          {/* Left Title */}
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-accent-gold uppercase block">
              Billing Console
            </span>
            <h1 className="serif-heading text-lg sm:text-xl font-bold text-text-primary leading-none mt-0.5">
              Invoice Generator
            </h1>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-wrap">
            {/* Save Invoice Button (Explicit Save without downloading) */}
            <button
              type="button"
              onClick={() => handleSaveInvoice(false)}
              disabled={syncingEvent}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                syncedSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/30"
              }`}
              title="Save invoice to Event Budget without downloading"
            >
              {syncingEvent ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : syncedSuccess ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <BookmarkCheck className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{syncedSuccess ? "Saved!" : "Save Invoice"}</span>
              <span className="sm:hidden">Save</span>
            </button>

            {/* Primary 1-Click Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf || downloadingPng}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-xs font-bold bg-accent-gold text-bg-primary hover:bg-accent-warm transition-all uppercase tracking-wider shadow-md shadow-accent-gold/10 disabled:opacity-50 whitespace-nowrap rounded-xl font-extrabold"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden xs:inline">Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden xs:inline">Download PDF</span>
                  <span className="xs:hidden">PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden bg-[#141414] border-b border-white/10 px-4 py-2 sticky top-14 z-20">
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab("editor")}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold tracking-wider uppercase transition-all ${
              mobileTab === "editor"
                ? "bg-accent-gold text-bg-primary shadow-sm"
                : "bg-white/5 text-text-muted hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Edit Form</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold tracking-wider uppercase transition-all ${
              mobileTab === "preview"
                ? "bg-accent-gold text-bg-primary shadow-sm"
                : "bg-white/5 text-text-muted hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>2. View Invoice</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Form Controls (Shown on desktop OR when mobileTab === 'editor') */}
        <div
          className={`lg:col-span-5 bg-[#121212] border border-white/10 p-3.5 sm:p-6 md:p-7 rounded-2xl space-y-5 sm:space-y-6 shadow-xl ${
            mobileTab === "editor" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="serif-heading text-lg sm:text-xl font-bold text-text-primary">
                Invoice Details
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Select services, customize &amp; download instantly.
              </p>
            </div>
            <button
              onClick={handleResetSample}
              className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-accent-gold transition-colors py-1 px-2 rounded bg-white/5"
              title="Reset Sample"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* 1. Client Information */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-[0.2em] text-accent-gold uppercase block">
              1. Client Information
            </span>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Client Name <span className="text-text-muted/60">(Optional on draft)</span>
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="Enter client name (e.g. Farhan & Ayesha)"
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-text-muted/40 focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* 2. Date & Payment Status */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-bold tracking-[0.2em] text-accent-gold uppercase block">
              2. Invoice Date &amp; Status
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.rawDate}
                  onClick={(e) => {
                    try {
                      if (typeof e.target.showPicker === "function") {
                        e.target.showPicker();
                      }
                    } catch {}
                  }}
                  onFocus={(e) => {
                    try {
                      if (typeof e.target.showPicker === "function") {
                        e.target.showPicker();
                      }
                    } catch {}
                  }}
                  onChange={handleDateChange}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer font-medium [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Payment Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStatusChange("UNPAID")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formData.status === "UNPAID"
                        ? "bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-sm"
                        : "bg-[#161616] border-white/10 text-text-muted hover:border-white/25 hover:text-white"
                    }`}
                  >
                    Unpaid
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("PARTIALLY PAID")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formData.status === "PARTIALLY PAID"
                        ? "bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-[#161616] border-white/10 text-text-muted hover:border-white/25 hover:text-white"
                    }`}
                  >
                    Partial
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange("PAID")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formData.status === "PAID"
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-sm"
                        : "bg-[#161616] border-white/10 text-text-muted hover:border-white/25 hover:text-white"
                    }`}
                  >
                    Paid
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Due Date
              </label>
              <input
                type="text"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                placeholder="Upon Receipt"
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:border-accent-gold/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* 3. Service & Scope Multi-Select */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[0.2em] text-accent-gold uppercase block">
                3. Service &amp; Scope
              </span>
              <span className="text-[10px] text-text-muted">
                Select 1 or multiple
              </span>
            </div>

            {/* Multi-Select Service Chips (Photography, Videography, Drone, Album) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => handleToggleService("photography")}
                className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold border transition-all text-center leading-tight rounded-xl cursor-pointer ${
                  services.photography
                    ? "bg-accent-gold text-bg-primary border-accent-gold shadow-md font-bold"
                    : "bg-[#161616] border-white/10 text-text-muted hover:border-white/30 hover:text-white"
                }`}
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span className="truncate">Photography</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleService("videography")}
                className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold border transition-all text-center leading-tight rounded-xl cursor-pointer ${
                  services.videography
                    ? "bg-accent-gold text-bg-primary border-accent-gold shadow-md font-bold"
                    : "bg-[#161616] border-white/10 text-text-muted hover:border-white/30 hover:text-white"
                }`}
              >
                <Film className="w-4 h-4 shrink-0" />
                <span className="truncate">Videography</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleService("drone")}
                className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold border transition-all text-center leading-tight rounded-xl cursor-pointer ${
                  services.drone
                    ? "bg-accent-gold text-bg-primary border-accent-gold shadow-md font-bold"
                    : "bg-[#161616] border-white/10 text-text-muted hover:border-white/30 hover:text-white"
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span className="truncate">Drone</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleService("album")}
                className={`flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold border transition-all text-center leading-tight rounded-xl cursor-pointer ${
                  services.album
                    ? "bg-accent-gold text-bg-primary border-accent-gold shadow-md font-bold"
                    : "bg-[#161616] border-white/10 text-text-muted hover:border-white/30 hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">Album</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Service Title
              </label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={(e) =>
                  setFormData({ ...formData, serviceName: e.target.value })
                }
                placeholder="e.g. Photography Services"
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:border-accent-gold/50 focus:outline-none transition-all"
              />
            </div>

            {/* Total Days & Dynamic Event Date Pickers */}
            <div className="space-y-3">
              {/* Total Days Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-text-muted">
                    Total Event Days
                  </label>
                  {formData.duration && (
                    <button
                      type="button"
                      onClick={() => handleDurationChange("")}
                      className="text-[10px] text-text-muted hover:text-rose-400 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    placeholder="e.g. 1 Day, 2 Days, 4 Days"
                    className="flex-1 bg-[#161616] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted/40 focus:border-accent-gold/50 focus:outline-none transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddDay}
                    className="px-3.5 py-2.5 rounded-xl bg-accent-gold/10 border border-accent-gold/30 hover:bg-accent-gold/20 text-accent-gold text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Add another event day"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Day</span>
                  </button>
                </div>

                {/* Quick Presets: 1 Day, 2 Days, 3 Days, 4 Days */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  {["1 Day", "2 Days", "3 Days", "4 Days"].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => handleDurationChange(dur)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                        formData.duration === dur
                          ? "bg-accent-gold/20 border-accent-gold text-accent-gold font-bold"
                          : "bg-white/5 border-white/10 text-text-muted hover:text-white hover:border-white/20"
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Event Shoot Date Pickers */}
              {Array.isArray(formData.eventDates) && formData.eventDates.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5 bg-[#141414] border border-white/10 rounded-2xl p-3.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent-gold" />
                      <span>Pick Event Dates ({formData.eventDates.length} {formData.eventDates.length === 1 ? "Day" : "Days"})</span>
                    </span>
                    <span className="text-[10px] text-accent-gold font-semibold">
                      Shows on Invoice
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {formData.eventDates.map((dVal, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          const input = e.currentTarget.querySelector('input[type="date"]');
                          if (input) {
                            input.focus();
                            try {
                              if (typeof input.showPicker === "function") {
                                input.showPicker();
                              }
                            } catch {}
                          }
                        }}
                        className="bg-[#181818] border border-white/10 rounded-xl p-2.5 space-y-1.5 hover:border-accent-gold/40 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-gold flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-accent-gold/80" />
                            <span>Day {idx + 1} Event Date:</span>
                          </span>
                          {dVal ? (
                            <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              {formatDateDisplay(dVal)}
                            </span>
                          ) : (
                            <span className="text-[9.5px] text-text-muted/60 italic">
                              Click to pick date
                            </span>
                          )}
                        </div>
                        <input
                          type="date"
                          value={dVal || ""}
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              if (typeof e.target.showPicker === "function") {
                                e.target.showPicker();
                              }
                            } catch {}
                          }}
                          onFocus={(e) => {
                            try {
                              if (typeof e.target.showPicker === "function") {
                                e.target.showPicker();
                              }
                            } catch {}
                          }}
                          onChange={(e) => handleEventDateChange(idx, e.target.value)}
                          className="w-full bg-[#121212] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-text-primary focus:border-accent-gold/50 focus:outline-none transition-all cursor-pointer font-medium [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Description / Subtext
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="High-resolution fine-art photography & candid coverage"
                className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:border-accent-gold/50 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* 4. Payment Amounts */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-bold tracking-[0.2em] text-accent-gold uppercase block">
              4. Payment &amp; Balance (PKR)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Total Project Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.totalAmount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:border-accent-gold/50 focus:outline-none font-mono font-bold transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Amount Paid / Advance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.paidAmount}
                  onChange={(e) => handlePaidAmountChange(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-text-primary focus:border-accent-gold/50 focus:outline-none font-mono font-bold transition-all"
                />
              </div>
            </div>

            {/* Computed Remaining Balance Box */}
            <div className="p-4 bg-[#161616] border border-accent-gold/30 rounded-xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block">
                    Remaining Balance Due
                  </span>
                  <span className="text-xl font-bold text-accent-gold font-mono">
                    PKR {remainingBalance.toLocaleString()}
                  </span>
                </div>
                <div>
                  {formData.status === "UNPAID" ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold">
                      100% Unpaid
                    </span>
                  ) : formData.status === "PAID" ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                      Paid in Full
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      Partial Due
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Preset Buttons (Full Width 3 Equal Columns) */}
              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/5">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      paidAmount: 0,
                      status: "UNPAID",
                    })
                  }
                  className={`text-center text-[11px] font-bold py-2 px-2 rounded-xl border transition-all cursor-pointer ${
                    formData.status === "UNPAID"
                      ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm"
                      : "bg-[#121212] border-white/10 text-text-muted hover:border-white/25 hover:text-white"
                  }`}
                >
                  All Unpaid
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      paidAmount: Math.round(formData.totalAmount / 2),
                      status: "PARTIALLY PAID",
                    })
                  }
                  className={`text-center text-[11px] font-bold py-2 px-2 rounded-xl border transition-all cursor-pointer ${
                    formData.status === "PARTIALLY PAID"
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                      : "bg-[#121212] border-white/10 text-text-muted hover:border-white/25 hover:text-white"
                  }`}
                >
                  50% Adv
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      paidAmount: formData.totalAmount,
                      status: "PAID",
                    })
                  }
                  className={`text-center text-[11px] font-bold py-2 px-2 rounded-xl border transition-all cursor-pointer ${
                    formData.status === "PAID"
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm"
                      : "bg-[#121212] border-white/10 text-text-muted hover:border-white/25 hover:text-white"
                  }`}
                >
                  Full Paid
                </button>
              </div>
            </div>
          </div>

          {/* 5. Custom Note (Optional) */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <label className="block text-xs font-medium text-text-muted">
              Custom Terms Note (Optional)
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="e.g. 1 Drone pilot included for the reception night."
              className="w-full bg-[#161616] border border-white/10 px-3.5 py-2 text-xs text-text-primary focus:border-accent-gold focus:outline-none"
            />
          </div>

          {/* Mobile Preview Switch Button */}
          <div className="pt-4 border-t border-white/10 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className="w-full py-3.5 bg-white/10 hover:bg-white/15 text-text-primary text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 border border-white/10 mb-3"
            >
              <Eye className="w-4 h-4 text-accent-gold" /> Preview Live Invoice
            </button>
          </div>

          {/* Save & Download Action Buttons */}
          <div className="pt-3 space-y-2.5">
            {/* Primary Save to Event Budget Button (NO download required!) */}
            <button
              type="button"
              onClick={() => handleSaveInvoice(false)}
              disabled={syncingEvent}
              className={`w-full py-3.5 text-xs font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg cursor-pointer ${
                syncedSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
              }`}
            >
              {syncingEvent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving to Event Budget...
                </>
              ) : syncedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Invoice Saved to Event Budget!
                </>
              ) : (
                <>
                  <BookmarkCheck className="w-4 h-4" /> Save Invoice to Event Budget
                </>
              )}
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf || downloadingPng}
              className="w-full py-3.5 bg-accent-gold text-bg-primary text-xs font-extrabold tracking-widest uppercase hover:bg-accent-warm transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/10 disabled:opacity-50 rounded-xl cursor-pointer"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF File...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Download Invoice (PDF)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Printable Preview (Shown on desktop OR when mobileTab === 'preview') */}
        <div
          className={`lg:col-span-7 flex flex-col items-center w-full ${
            mobileTab === "preview" ? "block" : "hidden lg:flex"
          }`}
        >
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-text-muted">
              Invoice Live Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileTab("editor")}
                className="lg:hidden text-xs font-bold text-accent-gold underline mr-2"
              >
                ← Back to Edit
              </button>
              <span className="text-[11px] text-accent-gold font-medium">
                Exact 1:1 Output
              </span>
            </div>
          </div>

          {/* Mobile Swipe Notice */}
          <div className="lg:hidden flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-text-muted mb-3 font-mono">
            <span>⇄ Swipe horizontally to inspect full invoice document</span>
          </div>

          {/* Invoice Document Canvas Container */}
          <div className="w-full overflow-x-auto pb-6 rounded-xl touch-pan-x">
            <div className="min-w-[650px] sm:min-w-0">
              <InvoiceDocument data={formData} id="printable-invoice-preview" />
            </div>
          </div>

          {/* Mobile Quick Action Buttons on Preview Screen */}
          <div className="w-full space-y-2.5 lg:hidden pb-6">
            <button
              type="button"
              onClick={() => handleSaveInvoice(false)}
              disabled={syncingEvent}
              className={`w-full py-3.5 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer transition-all ${
                syncedSuccess
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40"
              }`}
            >
              {syncingEvent ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : syncedSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <BookmarkCheck className="w-4 h-4" />
              )}
              <span>{syncedSuccess ? "Saved to Event Budget!" : "Save Invoice to Event Budget"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf || downloadingPng}
              className="w-full py-3.5 bg-accent-gold text-bg-primary text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-accent-warm shadow-lg shadow-accent-gold/20 disabled:opacity-50 rounded-xl cursor-pointer"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Downloading Invoice PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Invoice PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold ${
              toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
                : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
