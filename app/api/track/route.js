import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDeviceInfo(userAgent) {
  let device = "Desktop";
  let os = "Unknown OS";
  let browser = "Unknown Browser";

  if (!userAgent) return { device, os, browser };

  if (/mobile/i.test(userAgent)) device = "Mobile";
  else if (/tablet|ipad/i.test(userAgent)) device = "Tablet";

  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
  else if (/linux/i.test(userAgent)) os = "Linux";

  if (/edg/i.test(userAgent)) browser = "Edge";
  else if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = "Safari";
  else if (/opr\//i.test(userAgent)) browser = "Opera";

  return { device, os, browser };
}

function detectBotType(userAgent, city = "", country = "", os = "", isWebDriver = false) {
  if (isWebDriver === true) {
    return { isBot: true, botType: "Automated Webdriver / Script" };
  }

  const ua = (userAgent || "").toLowerCase();

  // 1. AI Search & LLM Crawlers
  if (ua.includes("gptbot") || ua.includes("chatgpt-user") || ua.includes("oai-searchbot")) {
    return { isBot: true, botType: "OpenAI ChatGPT Crawler" };
  }
  if (ua.includes("perplexitybot")) {
    return { isBot: true, botType: "Perplexity AI SearchBot" };
  }
  if (ua.includes("claudebot") || ua.includes("anthropic-ai") || ua.includes("claude-web")) {
    return { isBot: true, botType: "Anthropic Claude AI Bot" };
  }
  if (ua.includes("google-extended") || ua.includes("apis-google")) {
    return { isBot: true, botType: "Google Gemini / AI Crawler" };
  }
  if (ua.includes("bytespider")) {
    return { isBot: true, botType: "ByteDance / TikTok AI Crawler" };
  }
  if (ua.includes("cohere-ai")) {
    return { isBot: true, botType: "Cohere AI Bot" };
  }

  // 2. Search Engine Crawlers
  if (ua.includes("googlebot")) {
    return { isBot: true, botType: "Googlebot Search Indexer" };
  }
  if (ua.includes("bingbot")) {
    return { isBot: true, botType: "Microsoft Bing / Copilot Indexer" };
  }
  if (ua.includes("duckduckbot")) {
    return { isBot: true, botType: "DuckDuckGo Search Crawler" };
  }
  if (ua.includes("yandexbot") || ua.includes("baiduspider") || ua.includes("applebot")) {
    return { isBot: true, botType: "Search Engine Crawler" };
  }

  // 3. Social Media Link Preview Bots
  if (
    ua.includes("whatsapp") ||
    ua.includes("facebookexternalhit") ||
    ua.includes("meta-externalagent") ||
    ua.includes("telegrambot") ||
    ua.includes("twitterbot") ||
    ua.includes("linkedinbot") ||
    ua.includes("discordbot") ||
    ua.includes("slackbot")
  ) {
    return { isBot: true, botType: "Social Link Preview Bot" };
  }

  // 4. Cloud & Health Check Pingers
  if (
    ua.includes("vercel") ||
    ua.includes("headlesschrome") ||
    ua.includes("lighthouse") ||
    ua.includes("puppeteer") ||
    ua.includes("playwright") ||
    (os === "Linux" && (city.toLowerCase().includes("san jose") || country === "US") && !ua.includes("android"))
  ) {
    return { isBot: true, botType: "Cloud / System Health Check" };
  }

  // 5. Generic Scrapers
  if (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("curl") ||
    ua.includes("wget") ||
    ua.includes("python-requests") ||
    ua.includes("scrapy")
  ) {
    return { isBot: true, botType: "Automated Web Bot" };
  }

  return { isBot: false, botType: null };
}

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

    let visitorId = req.cookies.get("fsv_visitor_id")?.value || body.visitorId;
    if (!visitorId) {
      visitorId = `fsv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Extract device, OS, browser
    const userAgent = req.headers.get("user-agent") || "";
    const { device, os, browser } = getDeviceInfo(userAgent);

    // Extract Geo Metadata
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      body.country ||
      "Unknown";

    const city =
      req.headers.get("x-vercel-ip-city") ||
      body.city ||
      "Unknown";

    const region =
      req.headers.get("x-vercel-ip-country-region") ||
      body.region ||
      "Unknown";

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const path = body.path || "/";
    const referrer = body.referrer || req.headers.get("referer") || "Direct";

    // Detect Bot / Real Human
    // NOTE: isHumanVerified intentionally NOT used to override server detection.
    // Headless Chrome bots execute JS and fire scroll/dwell events — client signals
    // cannot be trusted to clear a confirmed server-side bot flag.
    const { isBot, botType } = detectBotType(userAgent, city, country, os, body.isWebDriver);

    // 1. Check if visitor already exists
    const { data: existingVisitor } = await supabase
      .from("analytics_visitors")
      .select("visitor_id, visit_count, is_bot, bot_type")
      .eq("visitor_id", visitorId)
      .single();

    const visitorName = body.visitorName || null;

    if (existingVisitor) {
      await supabase
        .from("analytics_visitors")
        .update({
          visit_count: (existingVisitor.visit_count || 1) + 1,
          last_seen: new Date().toISOString(),
          country: country !== "Unknown" ? country : undefined,
          city: city !== "Unknown" ? city : undefined,
          ip: ip !== "127.0.0.1" ? ip : undefined,
          device,
          browser,
          os,
          is_bot: isBot,
          bot_type: botType,
          ...(visitorName ? { visitor_name: visitorName } : {}),
        })
        .eq("visitor_id", visitorId);
    } else {
      await supabase.from("analytics_visitors").insert([
        {
          visitor_id: visitorId,
          visit_count: 1,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          country,
          city,
          region,
          ip,
          device,
          browser,
          os,
          referrer,
          is_bot: isBot,
          bot_type: botType,
          visitor_name: visitorName,
        },
      ]);
    }

    // 2. Log exact visit timestamp for session timeline
    await supabase.from("analytics_visit_logs").insert([
      {
        visitor_id: visitorId,
        visited_at: new Date().toISOString(),
        path,
        country,
        city,
        ip,
      },
    ]);

    const res = NextResponse.json({ success: true, visitorId, isBot, botType });
    res.cookies.set("fsv_visitor_id", visitorId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year persistence
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });

    return res;
  } catch (err) {
    console.error("Tracking API error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
