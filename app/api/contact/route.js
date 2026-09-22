import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/^["']|["']$/g, "");
    let supabaseKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ""
    ).trim().replace(/^["']|["']$/g, "");

    const defaultUrl = "https://pzjkqklnjirovtydoycs.supabase.co";
    const defaultKey = "sb_publishable_64rHjV3LSxtbnUSNVAFAKQ_TbxH1OW_";

    if (!supabaseUrl || !supabaseUrl.includes("supabase.co") || supabaseUrl.startsWith("sb_")) {
      supabaseUrl = defaultUrl;
    } else if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
      supabaseUrl = `https://${supabaseUrl}`;
    }

    if (!supabaseKey || supabaseKey.startsWith("http")) {
      supabaseKey = defaultKey;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));

    const { name, email, phone, date, message, visitorId } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Please provide your name and email." },
        { status: 400 }
      );
    }

    const cleanVisitorId =
      visitorId ||
      req.cookies.get("fsv_visitor_id")?.value ||
      `fsv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "Unknown";

    const city =
      req.headers.get("x-vercel-ip-city") ||
      "Unknown";

    // 1. Insert into contact_inquiries table
    try {
      await supabase.from("contact_inquiries").insert([
        {
          visitor_id: cleanVisitorId,
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || null,
          event_date: date?.trim() || null,
          subject: "Wedding Photography Inquiry",
          message: message?.trim() || "",
          country,
          city,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn("Could not insert into contact_inquiries:", e);
    }

    // 2. Also log in analytics_events
    try {
      await supabase.from("analytics_events").insert([
        {
          visitor_id: cleanVisitorId,
          event_name: "contact_submit",
          event_data: {
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || "",
            date: date?.trim() || "",
            message: message?.trim() || "",
          },
          path: "/#contact",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {}

    // 3. Mark visitor as 100% verified human and update name
    try {
      await supabase
        .from("analytics_visitors")
        .update({
          visitor_name: name.trim(),
          is_bot: false,
          bot_type: null,
          last_seen: new Date().toISOString(),
        })
        .eq("visitor_id", cleanVisitorId);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: "Inquiry successfully received and saved.",
    });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
