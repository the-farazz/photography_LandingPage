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

// POST /api/admin/events/[id]/payment - Record a new payment installment
export async function POST(req, { params }) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid payment amount is required" }, { status: 400 });
    }

    const payment_date = body.payment_date || new Date().toISOString().split("T")[0];
    const payment_method = body.payment_method || "Cash";
    const notes = (body.notes || "").trim();

    // 1. Fetch current event
    const { data: event, error: fetchError } = await supabase
      .from("event_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    // 2. Insert payment record
    const { data: newPayment, error: paymentError } = await supabase
      .from("event_payments")
      .insert([
        {
          event_id: id,
          amount,
          payment_date,
          payment_method,
          notes,
        },
      ])
      .select()
      .single();

    if (paymentError) {
      return NextResponse.json({ success: false, error: paymentError.message }, { status: 400 });
    }

    // 3. Recalculate event totals
    const newPaid = Number(event.paid_amount || 0) + amount;
    const newRemaining = Math.max(0, Number(event.total_amount || 0) - newPaid);
    let newStatus = "PARTIALLY PAID";
    if (newRemaining <= 0) {
      newStatus = "FULLY PAID";
    }

    // 4. Update event booking
    const { data: updatedEvent, error: updateError } = await supabase
      .from("event_bookings")
      .update({
        paid_amount: newPaid,
        remaining_amount: newRemaining,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
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
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      payment: newPayment,
      message: `Payment of Rs ${amount.toLocaleString()} recorded successfully!`,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
