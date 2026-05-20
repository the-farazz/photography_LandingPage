"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  const heroRef = useRef(null);
  const bgRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const descRef = useRef(null);
  const ctaRef = useRef(null);
  const indicatorRef = useRef(null);

  useEffect(() => {
    // Reveal animation sequence
    const tl = gsap.timeline();

    // Scale up the background image slowly on load
    tl.fromTo(
      bgRef.current,
      { scale: 1.1, opacity: 0 },
      { scale: 1, opacity: 0.6, duration: 2.2, ease: "power3.out" }
    );

    // Fade-in titles, description, CTAs sequentially
    tl.fromTo(
      titleRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" },
      "-=1.4"
    )
    .fromTo(
      subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, ease: "power3.out" },
      "-=0.9"
    )
    .fromTo(
      descRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, ease: "power3.out" },
      "-=0.7"
    )
    .fromTo(
      ctaRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.6"
    )
    .fromTo(
      indicatorRef.current,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.2"
    );

    // Continuous floating/pulsing motion for the scroll indicator
    gsap.to(indicatorRef.current, {
      y: 10,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    // Parallax scrolling effect on background image
    gsap.to(bgRef.current, {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }, []);

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg-primary pt-20"
    >
      {/* Background Cinematic Image with Overlays */}
      <div className="absolute inset-0 z-0">
        <Image
          ref={bgRef}
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1920"
          alt="Cinematic Wedding Vow Backdrop"
          fill
          priority
          className="object-cover object-center opacity-60"
        />
        {/* Deep moody black gradients to blend with background */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-transparent to-bg-primary/30" />
        {/* Subtle warm ambient radial highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.06)_0%,transparent_70%)]" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-8">
        {/* Slogan pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 border border-accent-gold/20 bg-bg-secondary/40 backdrop-blur-md rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-ping" />
          <span className="text-[11px] md:text-xs font-semibold tracking-[0.2em] text-accent-gold uppercase">
            Karachi, Pakistan
          </span>
        </div>

        {/* Studio Name Title */}
        <h1
          ref={titleRef}
          className="serif-heading text-6xl md:text-8xl lg:text-9xl font-bold tracking-tight text-text-primary mb-4"
        >
          FS <span className="text-accent-gold font-normal italic">Visual</span>
        </h1>

        {/* Slogan Heading */}
        <h2
          ref={subtitleRef}
          className="serif-heading text-2xl md:text-4xl lg:text-5xl font-light italic text-accent-warm tracking-wide mb-8"
        >
          &ldquo;Aap ki yaadon ka cinematic safar.&rdquo;
        </h2>

        {/* Emotion-driven descriptive copy */}
        <p
          ref={descRef}
          className="max-w-2xl mx-auto text-sm md:text-base text-text-muted leading-relaxed mb-12 font-light"
        >
          We don&apos;t just document wedding celebrations; we craft legacy visual poetry. Every glance, 
          every warm tear, and every high-energy celebration of your special day is preserved 
          in breathtaking cinematic quality. Let us turn your precious Karachi wedding moments into 
          timeless pieces of art.
        </p>

        {/* Call to Actions */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <a
            href="#contact"
            className="w-full sm:w-auto px-8 py-4 bg-accent-gold text-bg-primary text-xs font-bold tracking-widest uppercase hover:bg-accent-warm transition-all duration-300 rounded-none border border-accent-gold relative overflow-hidden group shadow-lg shadow-accent-gold/10"
          >
            Book a Session
          </a>
          <a
            href="#portfolio"
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-text-primary/30 text-text-primary text-xs font-bold tracking-widest uppercase hover:border-accent-gold hover:text-accent-gold transition-all duration-300 rounded-none"
          >
            View Our Work
          </a>
        </div>
      </div>

      {/* Animated Scroll Indicator */}
      <div
        ref={indicatorRef}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center cursor-pointer"
        onClick={() => {
          document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        <span className="text-[10px] tracking-[0.25em] text-text-muted uppercase mb-2">
          Scroll Down
        </span>
        <ArrowDown className="w-4 h-4 text-accent-gold" />
      </div>
    </section>
  );
}
