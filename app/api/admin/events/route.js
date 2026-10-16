import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
  let key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim().replace(/^["']|["']$/g, "");

  const defaultUrl = "https://pzjkqklnjirovtydoycs.supabase.co";
  const defaultKey = "sb_publishable_64rHjV3LSxtbnUSNVAFAKQ_TbxH1OW_";

  if (!url || !url.includes("supabase.co") || url.startsWith("sb_")) {
    url = defaultUrl;
  } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  if (!key || key.startsWith("http")) {
    key = defaultKey;
  }

  return createClient(url, key);
}

// GET /api/admin/events - Fetch all events with payments
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: events, error } = await supabase
      .from("event_bookings")
      .select(`
        *,
        event_payments (
          id,
          amount,
          payment_date,
          payment_method,
          notes,
          created_at
        )
      `)
      .order("event_date", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message, events: [] }, { status: 200 });
    }

    return NextResponse.json({ success: true, events: events || [] });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message, events: [] }, { status: 200 });
  }
}

// POST /api/admin/events - Create new event booking
export async function POST(req) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));

    const client_name = (body.client_name || body.clientName || "").trim();
    const client_phone = (body.client_phone || body.clientPhone || "").trim();
    const client_email = (body.client_email || body.clientEmail || "").trim();
    const event_title = (body.event_title || body.eventTitle || body.serviceName || "Photography Coverage").trim();
    const event_date = body.event_date || body.eventDate || body.rawDate || new Date().toISOString().split("T")[0];
    const event_location = (body.event_location || body.eventLocation || "Karachi, Pakistan").trim();
    const service_type = (body.service_type || body.serviceType || body.serviceName || "Photography & Videography").trim();
    const total_amount = Number(body.total_amount ?? body.totalAmount ?? 0);
    const paid_amount = Number(body.paid_amount ?? body.paidAmount ?? 0);
    const remaining_amount = Math.max(0, total_amount - paid_amount);
    const invoice_no = (body.invoice_no || body.invoiceNo || "").trim();
    const notes = (body.notes || "").trim();

    let status = "PARTIALLY PAID";
    if (paid_amount <= 0) {
      status = "UNPAID";
    } else if (remaining_amount <= 0) {
      status = "FULLY PAID";
    }

    const { data: newEvent, error: insertError } = await supabase
      .from("event_bookings")
      .insert([
        {
          client_name,
          client_phone,
          client_email,
          event_title,
          event_date,
          event_location,
          service_type,
          total_amount,
          paid_amount,
          remaining_amount,
          status,
          invoice_no,
          notes,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 400 });
    }

    // If an initial advance was paid, record it in event_payments
    if (paid_amount > 0 && newEvent) {
      await supabase.from("event_payments").insert([
        {
          event_id: newEvent.id,
          amount: paid_amount,
          payment_date: event_date,
          payment_method: body.payment_method || "Cash / Advance",
          notes: "Initial Advance / Booking Deposit",
        },
      ]);
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
