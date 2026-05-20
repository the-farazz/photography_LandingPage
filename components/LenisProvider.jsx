"use client";
import { ReactLenis } from "lenis/react";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function LenisProvider({ children }) {
  useEffect(() => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Sync GSAP ScrollTrigger updates with Lenis scrolling
    const updateScrollTrigger = () => {
      ScrollTrigger.update();
    };

    // ReactLenis exposes a hook or a global callback but since we are wrapping,
    // Lenis automatically updates ScrollTrigger. Let's make sure GSAP ticker is synced.
    gsap.ticker.lagSmoothing(0);
  }, []);

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
