"use client";
import { useState } from "react";
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
  Eye,
  Sliders,
} from "lucide-react";
import InvoiceDocument from "@/components/admin/InvoiceDocument";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AdminInvoicePage() {
  const formatDateToLong = (dateObj) => {
    return dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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

  const initialDate = new Date();

  // Multi-select services state
  const [services, setServices] = useState({
    photography: true,
    videography: true,
    drone: false,
  });

  // Mobile active tab: 'editor' | 'preview'
  const [mobileTab, setMobileTab] = useState("editor");

  const computeServiceTitleAndDesc = (serviceState, duration) => {
    const { photography, videography, drone } = serviceState;
    const durText = duration || "Event";

    if (photography && videography && drone) {
      return {
        title: "Photography, Videography & Drone Services",
        desc: `Complete photography, cinematic video production & aerial drone coverage (${durText})`,
      };
    }
    if (photography && videography && !drone) {
      return {
        title: "Photography & Videography Services",
        desc: `Complete photography & cinematic video production (${durText})`,
      };
    }
    if (photography && !videography && drone) {
      return {
        title: "Photography & Drone Services",
        desc: `High-resolution fine-art photography & aerial drone coverage (${durText})`,
      };
    }
    if (!photography && videography && drone) {
      return {
        title: "Videography & Drone Services",
        desc: `Cinematic video production & aerial drone coverage (${durText})`,
      };
    }
    if (photography && !videography && !drone) {
      return {
        title: "Photography Services",
        desc: `High-resolution fine-art photography & candid coverage (${durText})`,
      };
    }
    if (!photography && videography && !drone) {
      return {
        title: "Videography Services",
        desc: `On-location video production & coverage (${durText})`,
      };
    }
    if (!photography && !videography && drone) {
      return {
        title: "Drone Cinematography Services",
        desc: `Aerial drone footage & venue cinematography (${durText})`,
      };
    }
    return {
      title: "Photography & Videography Services",
      desc: `Complete event coverage (${durText})`,
    };
  };

  const [formData, setFormData] = useState({
    clientName: "Ahsan",
    clientId: generateRandomClientId(),
    invoiceNo: generateRandomInvoiceNo(),
    rawDate: initialDate.toISOString().split("T")[0],
    invoiceDate: formatDateToLong(initialDate),
    dueDate: "Upon Receipt",
    serviceName: "Photography & Videography Services",
    duration: "4 Days",
    description: "Complete photography & cinematic video production (4 Days)",
    totalAmount: 23000,
    paidAmount: 8000,
    status: "PARTIALLY PAID",
    notes: "",
  });

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [copied, setCopied] = useState(false);

  // Toggle multi-select service options
  const handleToggleService = (key) => {
    const nextServices = { ...services, [key]: !services[key] };
    
    // Ensure at least one service remains checked
    if (!nextServices.photography && !nextServices.videography && !nextServices.drone) {
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

  const handleDurationChange = (newDuration) => {
    const computed = computeServiceTitleAndDesc(services, newDuration);
    setFormData((prev) => ({
      ...prev,
      duration: newDuration,
      description: computed.desc,
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
    const defaultServices = { photography: true, videography: true, drone: false };
    const computed = computeServiceTitleAndDesc(defaultServices, "4 Days");

    setServices(defaultServices);
    setFormData({
      clientName: "Ahsan",
      clientId: generateRandomClientId(),
      invoiceNo: generateRandomInvoiceNo(),
      rawDate: now.toISOString().split("T")[0],
      invoiceDate: formatDateToLong(now),
      dueDate: "Upon Receipt",
      serviceName: computed.title,
      duration: "4 Days",
      description: computed.desc,
      totalAmount: 23000,
      paidAmount: 8000,
      status: "PARTIALLY PAID",
      notes: "",
    });
  };

  const remainingBalance = Math.max(
    0,
    Number(formData.totalAmount || 0) - Number(formData.paidAmount || 0)
  );

  // 1-Click Direct Download as PDF (No printer dialog)
  const handleDownloadPDF = async () => {
    const element = document.getElementById("printable-invoice");
    if (!element) return;

    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
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
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 1-Click Direct Download as High-Res Image (PNG)
  const handleDownloadPNG = async () => {
    const element = document.getElementById("printable-invoice");
    if (!element) return;

    try {
      setDownloadingPng(true);
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const link = document.createElement("a");
      const filename = `${formData.invoiceNo || "Invoice"}_${formData.clientName || "Client"}.png`.replace(/\s+/g, "_");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Image generation error:", err);
    } finally {
      setDownloadingPng(false);
    }
  };

  // Copy WhatsApp summary message
  const handleCopyWhatsAppSummary = () => {
    const summaryText = `*FS VISUALS - INVOICE DETAILS*
━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${formData.invoiceNo}
👤 *Client Name:* ${formData.clientName} (${formData.clientId})
📅 *Date:* ${formData.invoiceDate}
🎬 *Service:* ${formData.serviceName} (${formData.duration})
💰 *Total Amount:* PKR ${Number(formData.totalAmount).toLocaleString()}
✅ *Advance Paid:* PKR ${Number(formData.paidAmount).toLocaleString()}
⏳ *Remaining Balance:* PKR ${Number(remainingBalance).toLocaleString()}
📌 *Status:* ${formData.status}
━━━━━━━━━━━━━━━━━━━━
_“Aap ki yaadon ka cinematic safar.”_
FS Visuals Karachi | +92 327 3129464`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-text-primary flex flex-col font-sans">
      {/* Responsive Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#111111] border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 shadow-lg">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2">
          {/* Left: Brand & Back */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              href="/"
              className="flex items-center justify-center p-2 sm:py-1.5 sm:px-3 text-xs font-semibold text-text-muted hover:text-accent-gold transition-colors rounded bg-white/5 border border-white/5"
              title="Back to Website"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline ml-1.5">Back to Website</span>
            </Link>

            <div className="flex items-center gap-1.5">
              <span className="serif-heading text-base sm:text-lg font-bold tracking-wider text-text-primary whitespace-nowrap">
                FS <span className="text-accent-gold">VISUALS</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent-gold/20 text-accent-gold border border-accent-gold/30 whitespace-nowrap hidden xs:inline-block">
                Admin
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* WhatsApp Text */}
            <button
              onClick={handleCopyWhatsAppSummary}
              className="flex items-center gap-1 p-2 sm:px-3 sm:py-2 text-xs font-bold bg-white/5 border border-white/10 text-text-muted hover:text-white transition-colors uppercase tracking-wider rounded-none"
              title="Copy WhatsApp text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{copied ? "Copied!" : "WhatsApp Text"}</span>
            </button>

            {/* Download Image Button */}
            <button
              onClick={handleDownloadPNG}
              disabled={downloadingPng || downloadingPdf}
              className="flex items-center gap-1 p-2 sm:px-3 sm:py-2 text-xs font-bold bg-[#1b1b1b] border border-white/20 text-text-primary hover:border-accent-gold hover:text-accent-gold transition-all uppercase tracking-wider disabled:opacity-50 rounded-none"
              title="Download Invoice as Image"
            >
              {downloadingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              <span className="hidden lg:inline">{downloadingPng ? "Saving..." : "Save Image"}</span>
            </button>

            {/* Primary 1-Click Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf || downloadingPng}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 text-xs font-bold bg-accent-gold text-bg-primary hover:bg-accent-warm transition-all uppercase tracking-wider shadow-md shadow-accent-gold/10 disabled:opacity-50 whitespace-nowrap rounded-none"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden xs:inline">Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Download PDF</span>
                  <span className="xs:hidden">PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden bg-[#141414] border-b border-white/10 px-4 py-2 sticky top-[53px] z-20">
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
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Form Controls (Shown on desktop OR when mobileTab === 'editor') */}
        <div
          className={`lg:col-span-5 bg-[#121212] border border-white/10 p-4 sm:p-6 lg:p-8 space-y-6 shadow-xl ${
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
              <label className="block text-xs font-medium text-text-muted mb-1">
                Client Name *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="e.g. Ahsan"
                className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors"
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
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.rawDate}
                  onChange={handleDateChange}
                  className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none cursor-pointer"
                >
                  <option value="PARTIALLY PAID">PARTIALLY PAID</option>
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID / DUE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Due Date
              </label>
              <input
                type="text"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                placeholder="Upon Receipt"
                className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none"
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

            {/* Multi-Select Service Chips (Photography, Videography, Drone) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleToggleService("photography")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-[11px] sm:text-xs font-semibold border transition-all text-center leading-tight ${
                  services.photography
                    ? "bg-accent-gold text-bg-primary border-accent-gold shadow-sm font-bold"
                    : "bg-[#1b1b1b] border-white/10 text-text-muted hover:border-white/30"
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span>Photography</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleService("videography")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-[11px] sm:text-xs font-semibold border transition-all text-center leading-tight ${
                  services.videography
                    ? "bg-accent-gold text-bg-primary border-accent-gold shadow-sm font-bold"
                    : "bg-[#1b1b1b] border-white/10 text-text-muted hover:border-white/30"
                }`}
              >
                <Film className="w-3.5 h-3.5 shrink-0" />
                <span>Videography</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleService("drone")}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-[11px] sm:text-xs font-semibold border transition-all text-center leading-tight ${
                  services.drone
                    ? "bg-accent-gold text-bg-primary border-accent-gold shadow-sm font-bold"
                    : "bg-[#1b1b1b] border-white/10 text-text-muted hover:border-white/30"
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>Drone</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                Service Title
              </label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={(e) =>
                  setFormData({ ...formData, serviceName: e.target.value })
                }
                placeholder="e.g. Photography & Videography Services"
                className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="e.g. 4 Days"
                  className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Description / Subtext
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Complete photography & cinematic video production (4 Days)"
                  className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4. Payment Amounts */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <span className="text-[11px] font-bold tracking-[0.2em] text-accent-gold uppercase block">
              4. Payment &amp; Balance (PKR)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Total Project Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalAmount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">
                  Amount Paid / Advance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.paidAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paidAmount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2.5 text-sm text-text-primary focus:border-accent-gold focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Computed Remaining Balance Box */}
            <div className="p-4 bg-[#1b1b1b] border border-accent-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted block">
                  Remaining Balance Due:
                </span>
                <span className="text-xl font-bold text-accent-gold font-mono">
                  PKR {remainingBalance.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      paidAmount: formData.totalAmount,
                      status: "PAID",
                    })
                  }
                  className="flex-1 sm:flex-none text-[10px] uppercase font-semibold px-2.5 py-1.5 bg-white/5 border border-white/10 text-text-muted hover:text-white text-center"
                >
                  Full Paid
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
                  className="flex-1 sm:flex-none text-[10px] uppercase font-semibold px-2.5 py-1.5 bg-white/5 border border-white/10 text-text-muted hover:text-white text-center"
                >
                  50% Adv
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
              className="w-full bg-[#1b1b1b] border border-white/10 px-3.5 py-2 text-xs text-text-primary focus:border-accent-gold focus:outline-none"
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

          {/* Big Download PDF Button */}
          <div className="pt-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf || downloadingPng}
              className="w-full py-4 bg-accent-gold text-bg-primary text-xs font-bold tracking-widest uppercase hover:bg-accent-warm transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/10 disabled:opacity-50 rounded-none"
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

          {/* Invoice Document Canvas Container */}
          <div className="w-full overflow-x-auto pb-8 rounded-sm">
            <div className="min-w-[650px] sm:min-w-0">
              <InvoiceDocument data={formData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
