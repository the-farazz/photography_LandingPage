"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function trackClientEvent(eventName, eventData = {}) {
  if (typeof window === "undefined") return;

  try {
    const isOwnerDevice = localStorage.getItem("fsv_is_admin_device") === "true";
    const isExclusionActive = localStorage.getItem("fsv_exclude_owner") !== "false";
    if (isOwnerDevice && isExclusionActive) return;
  } catch {}

  const visitorId = localStorage.getItem("fsv_visitor_id");
  if (!visitorId) return;

  try {
    fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        eventName,
        eventData,
        path: window.location.pathname,
      }),
    }).catch(() => {});
  } catch {}
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Never track admin panel pages
    if (pathname?.startsWith("/admin")) return;

    // Check if this is an Admin / Owner device with Exclusion Mode Active
    try {
      const isOwnerDevice = localStorage.getItem("fsv_is_admin_device") === "true";
      const isExclusionActive = localStorage.getItem("fsv_exclude_owner") !== "false";
      if (isOwnerDevice && isExclusionActive) {
        return;
      }
    } catch {}

    let hasSentHumanVerification = false;

    const trackVisit = async () => {
      try {
        let visitorId = localStorage.getItem("fsv_visitor_id");
        if (!visitorId) {
          visitorId = `fsv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("fsv_visitor_id", visitorId);
        }

        // Fast client-side geo lookup fallback
        let city = "Unknown";
        let country = "Unknown";
        let region = "Unknown";

        try {
          const geoRes = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2000) });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            city = geoData.city || "Unknown";
            country = geoData.country_name || "Unknown";
            region = geoData.region || "Unknown";
          }
        } catch {
          // Server will extract from headers
        }

        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get("utm_source") || urlParams.get("ref") || urlParams.get("source");
        const detectedReferrer = utmSource || document.referrer || "Direct";
        const isWebDriver = Boolean(navigator.webdriver);

        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            path: pathname || "/",
            referrer: detectedReferrer,
            city,
            country,
            region,
            isWebDriver,
            isHumanVerified: localStorage.getItem("fsv_human_verified") === "true",
          }),
        });
      } catch (err) {
        // Silent error suppression
      }
    };

    trackVisit();

    // Trigger human verification upon genuine user interactions
    const verifyHuman = (trigger) => {
      if (hasSentHumanVerification) return;
      hasSentHumanVerification = true;
      try {
        localStorage.setItem("fsv_human_verified", "true");
      } catch {}
      trackClientEvent("human_verified", {
        trigger,
        scrollY: window.scrollY,
        timestamp: Date.now(),
      });
    };

    // 1. Human Interaction Listeners (Scroll, Touch, Keydown, Pointer)
    const handleScroll = () => {
      if (window.scrollY > 30) {
        verifyHuman("page_scroll");
      }
    };

    const handlePointerOrTouch = () => {
      verifyHuman("pointer_interaction");
    };

    const handleKeydown = () => {
      verifyHuman("keyboard_input");
    };

    const handleMouseMove = (e) => {
      if (Math.abs(e.movementX) > 2 || Math.abs(e.movementY) > 2) {
        verifyHuman("mouse_movement");
      }
    };

    // 2. Dwell Time Timer (>= 3s on page)
    const dwellTimer = setTimeout(() => {
      if (document.visibilityState === "visible") {
        verifyHuman("active_dwell_time_3s");
      }
    }, 3000);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointerdown", handlePointerOrTouch, { passive: true });
    window.addEventListener("touchstart", handlePointerOrTouch, { passive: true });
    window.addEventListener("keydown", handleKeydown, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 3. CTA & Action Click Listener
    const handleGlobalClick = (e) => {
      verifyHuman("cta_or_button_click");
      const target = e.target?.closest("a, button");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      const text = target.innerText?.trim() || target.getAttribute("aria-label") || "Button";

      if (
        href.includes("whatsapp") ||
        href.includes("wa.me") ||
        href.includes("tel:") ||
        href.includes("instagram") ||
        href.includes("contact") ||
        href.includes("pricing") ||
        href.startsWith("#") ||
        target.getAttribute("type") === "submit"
      ) {
        trackClientEvent("cta_click", {
          label: text.substring(0, 50),
          destination: href || "Action Click",
        });
      }
    };

    document.addEventListener("click", handleGlobalClick, { passive: true });

    // 4. Section Scroll & Exploration Observer
    const observedSections = new Set();
    const sectionElements = document.querySelectorAll("section[id], header[id]");

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute("id");
            if (sectionId && !observedSections.has(sectionId)) {
              observedSections.add(sectionId);
              const formattedName = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
              trackClientEvent("section_view", {
                section: formattedName,
              });
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    sectionElements.forEach((el) => sectionObserver.observe(el));

    // 5. Live Heartbeat Ping every 30s to track Active Online status
    const heartbeatInterval = setInterval(() => {
      const visitorId = localStorage.getItem("fsv_visitor_id");
      if (visitorId && document.visibilityState === "visible") {
        fetch("/api/track/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorId,
            eventName: "heartbeat",
            path: pathname || "/",
          }),
        }).catch(() => {});
      }
    }, 30000);

    return () => {
      clearTimeout(dwellTimer);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointerdown", handlePointerOrTouch);
      window.removeEventListener("touchstart", handlePointerOrTouch);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleGlobalClick);
      sectionObserver.disconnect();
      clearInterval(heartbeatInterval);
    };
  }, [pathname]);

  return null;
}
