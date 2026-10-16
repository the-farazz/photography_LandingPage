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

// DELETE /api/admin/events/[id]
export async function DELETE(req, { params }) {
  try {
    const supabase = getSupabase();
    const { id } = await params;

    const { error } = await supabase
      .from("event_bookings")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/events/[id] - Edit details
export async function PATCH(req, { params }) {
  try {
    const supabase = getSupabase();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (body.client_name !== undefined) updatePayload.client_name = body.client_name;
    if (body.client_phone !== undefined) updatePayload.client_phone = body.client_phone;
    if (body.client_email !== undefined) updatePayload.client_email = body.client_email;
    if (body.event_title !== undefined) updatePayload.event_title = body.event_title;
    if (body.event_date !== undefined) updatePayload.event_date = body.event_date;
    if (body.event_location !== undefined) updatePayload.event_location = body.event_location;
    if (body.service_type !== undefined) updatePayload.service_type = body.service_type;
    if (body.notes !== undefined) updatePayload.notes = body.notes;

    if (body.total_amount !== undefined) {
      updatePayload.total_amount = Number(body.total_amount);
      if (body.paid_amount !== undefined) {
        updatePayload.paid_amount = Number(body.paid_amount);
      }
      updatePayload.remaining_amount = Math.max(0, updatePayload.total_amount - (updatePayload.paid_amount ?? 0));
      if (updatePayload.paid_amount <= 0) {
        updatePayload.status = "UNPAID";
      } else if (updatePayload.remaining_amount <= 0) {
        updatePayload.status = "FULLY PAID";
      } else {
        updatePayload.status = "PARTIALLY PAID";
      }
    }

    const { data: updatedEvent, error } = await supabase
      .from("event_bookings")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
