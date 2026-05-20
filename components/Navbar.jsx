"use client";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Handle background blur on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    handleScroll(); // Call on mount to set initial state correctly
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP animation for mobile menu
  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { x: "100%", opacity: 0 },
        { x: "0%", opacity: 1, duration: 0.5, ease: "power4.out" }
      );
      // Animate links inside mobile menu
      gsap.fromTo(
        ".mobile-link",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, delay: 0.2, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Services", href: "#services" },
    { label: "Portfolio", href: "#portfolio" },
    { label: "About", href: "#about" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-none outline-none ${
          scrolled
            ? "glass-navbar-custom py-4 shadow-2xl shadow-black/50"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            className="serif-heading text-2xl md:text-3xl font-bold tracking-widest text-text-primary group"
          >
            FS <span className="text-accent-gold transition-colors duration-300 group-hover:text-accent-warm">VISUAL</span>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium tracking-wider text-text-primary/80 hover:text-accent-gold transition-colors duration-300 relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-accent-gold after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Book Now Button */}
          <div className="hidden lg:block">
            <a
              href="#contact"
              className="inline-block px-6 py-2.5 border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-bg-primary text-xs font-semibold tracking-widest uppercase transition-all duration-300 rounded-none relative overflow-hidden group"
            >
              <span className="relative z-10">Book Now</span>
              <span className="absolute inset-0 bg-accent-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-text-primary hover:text-accent-gold transition-colors p-2"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer content */}
          <div
            ref={mobileMenuRef}
            className="relative w-4/5 max-w-sm h-full bg-bg-secondary border-l border-white/5 p-8 flex flex-col justify-between z-10"
          >
            <div className="flex flex-col space-y-8 mt-16">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="mobile-link text-2xl font-light serif-heading tracking-wide text-text-primary hover:text-accent-gold transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="mobile-link flex flex-col space-y-4">
              <a
                href="#contact"
                onClick={() => setIsOpen(false)}
                className="w-full text-center px-6 py-3 bg-accent-gold text-bg-primary hover:bg-accent-warm text-xs font-bold tracking-widest uppercase transition-all duration-300 rounded-none"
              >
                Book Now
              </a>
              <p className="text-[10px] text-text-muted tracking-widest text-center mt-4 uppercase">
                Aap ki yaadon ka cinematic safar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
