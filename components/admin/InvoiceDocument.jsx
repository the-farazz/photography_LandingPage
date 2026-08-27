"use client";
import React from "react";

export default function InvoiceDocument({ data }) {
  const {
    clientName = "Ahsan",
    clientId = "CLI-2026-089",
    invoiceNo = "INV-2026-0042",
    invoiceDate = "August 25, 2026",
    dueDate = "Upon Receipt",
    serviceName = "Videography Services",
    description = "On-location video production & coverage (4 Days)",
    duration = "4 Days",
    totalAmount = 23000,
    paidAmount = 8000,
    status = "PARTIALLY PAID",
    notes = "",
  } = data || {};

  const remainingBalance = Math.max(0, Number(totalAmount || 0) - Number(paidAmount || 0));

  const formatPKR = (num) => {
    return `PKR ${Number(num || 0).toLocaleString("en-US")}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case "PAID":
        return { text: "PAID", bg: "bg-[#e8f5e9]", color: "text-[#2e7d32]" };
      case "UNPAID":
      case "NOT PAID":
        return { text: "UNPAID", bg: "bg-[#ffebee]", color: "text-[#c62828]" };
      default:
        return { text: "PARTIALLY PAID", bg: "bg-[#eceff1]", color: "text-[#455a64]" };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      id="printable-invoice"
      className="bg-white text-black w-full max-w-[800px] mx-auto p-10 md:p-12 shadow-2xl box-border selection:bg-neutral-200"
      style={{
        fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between pb-6">
          <div>
            <h1
              className="text-[30px] md:text-[34px] font-extrabold tracking-[0.02em] text-black m-0 leading-none"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800 }}
            >
              FS VISUALS
            </h1>
            <p
              className="text-[10px] md:text-[11px] tracking-[0.28em] text-[#71717a] uppercase font-medium mt-2"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
            >
              PHOTOGRAPHY &amp; VIDEOGRAPHY
            </p>
          </div>

          <div className="flex flex-col items-end">
            <h2
              className="text-[30px] md:text-[34px] font-normal tracking-[0.2em] text-black m-0 leading-tight uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
            >
              INVOICE
            </h2>
            <div
              className={`mt-3.5 px-3.5 py-1 text-[9.5px] font-bold tracking-[0.16em] uppercase rounded-[2px] ${badge.bg} ${badge.color}`}
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
            >
              {badge.text}
            </div>
          </div>
        </div>

        {/* Divider line */}
        <div className="w-full h-[1px] bg-[#e9ecef] mb-8" />

        {/* Billed To & Metadata */}
        <div className="grid grid-cols-2 gap-6 mb-10 items-start">
          {/* Left: Client Info */}
          <div>
            <p
              className="text-[10.5px] tracking-[0.18em] uppercase text-[#6c757d] font-semibold mb-1"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
            >
              BILLED TO
            </p>
            <h3
              className="text-[15.5px] font-bold text-black leading-tight"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
            >
              {clientName || "Client Name"}
            </h3>
            <p
              className="text-[12.5px] text-[#495057] font-normal mt-1"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
            >
              Client ID: {clientId}
            </p>
          </div>

          {/* Right: Invoice Metadata */}
          <div className="flex flex-col items-end text-right space-y-1.5">
            <div className="flex items-center justify-end gap-2">
              <span
                className="text-[10.5px] tracking-[0.14em] uppercase text-[#6c757d] font-semibold"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
              >
                INVOICE NO:
              </span>
              <span
                className="font-bold text-black text-[13px]"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
              >
                {invoiceNo}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span
                className="text-[10.5px] tracking-[0.14em] uppercase text-[#6c757d] font-semibold"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
              >
                INVOICE DATE:
              </span>
              <span
                className="font-normal text-black text-[13px]"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
              >
                {invoiceDate}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span
                className="text-[10.5px] tracking-[0.14em] uppercase text-[#6c757d] font-semibold"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
              >
                DUE DATE:
              </span>
              <span
                className="font-normal text-black text-[13px]"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
              >
                {dueDate}
              </span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="mb-8">
          {/* Table Header Bar */}
          <div
            className="grid grid-cols-12 py-2 px-3 bg-[#f8f9fa] border-b-[2px] border-black text-[10.5px] font-bold tracking-[0.18em] uppercase text-[#6c757d]"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
          >
            <div className="col-span-7 text-left">DESCRIPTION</div>
            <div className="col-span-2 text-center">DURATION</div>
            <div className="col-span-3 text-right">AMOUNT</div>
          </div>

          {/* Table Row */}
          <div className="grid grid-cols-12 py-4 px-3 border-b border-[#e9ecef] items-start">
            <div className="col-span-7 pr-4">
              <p
                className="font-bold text-[14.5px] text-black leading-tight"
                style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
              >
                {serviceName}
              </p>
              {description && (
                <p
                  className="text-[12.5px] text-[#6c757d] font-normal mt-1 leading-snug"
                  style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
                >
                  {description}
                </p>
              )}
            </div>
            <div
              className="col-span-2 text-center font-semibold text-[13px] text-black pt-0.5"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600 }}
            >
              {duration}
            </div>
            <div
              className="col-span-3 text-right font-bold text-[13.5px] text-black pt-0.5"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
            >
              {formatPKR(totalAmount)}
            </div>
          </div>
        </div>

        {/* Summary Totals */}
        <div className="flex flex-col items-end mb-6 space-y-2">
          <div className="flex items-center justify-between w-64 text-[12.5px]">
            <span
              className="text-[#495057] font-medium"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
            >
              Total Project Amount:
            </span>
            <span
              className="font-bold text-black text-[13.5px]"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
            >
              {formatPKR(totalAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between w-64 text-[12.5px]">
            <span
              className="text-[#495057] font-medium"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
            >
              Amount Paid (Advance):
            </span>
            <span
              className="font-bold text-[#2e7d32] text-[13.5px]"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
            >
              - {formatPKR(paidAmount)}
            </span>
          </div>
        </div>

        {/* Black Highlight Bar */}
        <div className="bg-black text-white px-6 py-4 mb-8 flex items-center justify-between rounded-none shadow-sm">
          <span
            className="text-[12px] font-bold tracking-[0.22em] uppercase text-white"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
          >
            REMAINING BALANCE DUE
          </span>
          <span
            className="text-[22px] font-bold tracking-[0.02em] text-white"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
          >
            {formatPKR(remainingBalance)}
          </span>
        </div>

        {/* Terms & Payment Notes */}
        <div className="mb-6">
          <div className="pb-1.5 border-b border-[#e9ecef]">
            <h4
              className="text-[10.5px] tracking-[0.18em] uppercase text-[#6c757d] font-bold"
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
            >
              TERMS &amp; PAYMENT NOTES
            </h4>
          </div>

          <div
            className="pt-2.5 space-y-2 text-[11.5px] text-[#495057] leading-relaxed font-normal"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
          >
            <p>
              <strong className="text-black font-bold">• Remaining Balance:</strong>{" "}
              The remaining balance of {formatPKR(remainingBalance)} must be paid on the day of the main event.
            </p>
            <p>
              <strong className="text-black font-bold">• Deliverables:</strong>{" "}
              We take every reasonable precaution to keep your photographs and project files safe and secure,
              including appropriate backup procedures. In the rare event of an unforeseen technical issue beyond our
              reasonable control, FS Visuals cannot be held liable for unforeseen technical accidents, such as sudden
              power disruptions or storage media failures. However, we will do our best to minimize any impact and
              assist wherever possible.
            </p>
            {notes && (
              <p>
                <strong className="text-black font-bold">• Note:</strong> {notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Message */}
      <div className="pt-6 mt-6 border-t border-[#e9ecef] text-center">
        <h5
          className="font-bold text-[12px] tracking-[0.12em] text-black uppercase mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
        >
          THANK YOU FOR CHOOSING FS VISUALS
        </h5>
        <p
          className="text-[11.5px] text-[#6c757d] font-normal mb-2.5"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
        >
          We are excited to capture your special moments and turn them into memories that last lifetime.
        </p>
        <p
          className="font-bold italic text-[12px] text-black m-0"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
        >
          FS Visuals
        </p>
        <p
          className="italic text-[12px] font-bold text-black mt-0.5"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}
        >
          &ldquo;Aap ki yaadon ka cinematic safar.&rdquo;
        </p>
      </div>
    </div>
  );
}
