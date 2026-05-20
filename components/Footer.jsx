"use client";
import { Facebook, Instagram, ArrowUp } from "lucide-react";

const TiktokIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const WhatsappIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.488 2.01 14.039.986 11.995.986 6.562.986 2.138 5.357 2.13 10.789c-.001 1.677.449 3.311 1.305 4.747L2.457 20.36l4.19-1.206z" />
    <path d="M17.07 14.288c-.282-.142-1.67-.825-1.928-.92-.259-.096-.447-.142-.635.142-.188.283-.728.92-.892 1.107-.165.188-.33.213-.612.071-.282-.141-1.19-.439-2.267-1.399-.838-.747-1.403-1.671-1.567-1.954-.165-.283-.018-.436.123-.576.127-.127.282-.33.424-.496.142-.165.189-.283.283-.472.094-.189.047-.354-.024-.496-.071-.141-.635-1.53-.87-2.096-.229-.553-.46-.477-.635-.487-.165-.008-.353-.01-.54-.01-.189 0-.495.071-.754.354-.259.283-.99 1.015-.99 2.477s1.06 2.879 1.208 3.068c.148.19 2.087 3.187 5.056 4.47.706.305 1.258.487 1.688.624.708.226 1.353.194 1.862.118.568-.085 1.67-.682 1.905-1.34.236-.658.236-1.223.165-1.34-.07-.118-.259-.188-.541-.33" />
  </svg>
);

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-bg-secondary pt-20 pb-10 overflow-hidden border-t border-white/5 gradient-mesh-footer">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Top footer row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-white/5">
          
          {/* Column 1: Studio info */}
          <div className="md:col-span-2 space-y-6">
            <a
              href="#home"
              className="serif-heading text-3xl font-bold tracking-widest text-text-primary block"
            >
              FS <span className="text-accent-gold">VISUAL</span>
            </a>
            <p className="serif-heading text-lg italic text-accent-warm font-light max-w-sm">
              &ldquo;Aap ki yaadon ka cinematic safar.&rdquo;
            </p>
            <p className="text-text-muted text-xs font-light max-w-sm leading-relaxed">
              Preserving traditional emotions and modern celebrations through premium cinematography and fine-art photography in Karachi, Pakistan.
            </p>
          </div>

          {/* Column 2: Navigation links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-widest uppercase text-accent-gold">
              Navigation
            </h4>
            <div className="flex flex-col space-y-2.5">
              {[
                { label: "Home", href: "#home" },
                { label: "Services", href: "#services" },
                { label: "Portfolio", href: "#portfolio" },
                { label: "About", href: "#about" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs text-text-muted hover:text-accent-gold transition-colors duration-300 font-light"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Secondary navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-widest uppercase text-accent-gold">
              Information
            </h4>
            <div className="flex flex-col space-y-2.5">
              {[
                { label: "Testimonials", href: "#testimonials" },
                { label: "Pricing Packages", href: "#pricing" },
                { label: "Contact Us", href: "#contact" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs text-text-muted hover:text-accent-gold transition-colors duration-300 font-light"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom footer row */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://www.facebook.com/the.fs.visuals"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-bg-primary hover:bg-accent-gold hover:text-bg-primary text-text-muted transition-all duration-300 border border-white/5 hover:border-accent-gold"
              aria-label="Facebook Profile"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/the_fs_visuals/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-bg-primary hover:bg-accent-gold hover:text-bg-primary text-text-muted transition-all duration-300 border border-white/5 hover:border-accent-gold"
              aria-label="Instagram Profile"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.tiktok.com/@the_fs_visuals"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-bg-primary hover:bg-accent-gold hover:text-bg-primary text-text-muted transition-all duration-300 border border-white/5 hover:border-accent-gold"
              aria-label="TikTok Profile"
            >
              <TiktokIcon className="w-4 h-4" />
            </a>
            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-bg-primary hover:bg-accent-gold hover:text-bg-primary text-text-muted transition-all duration-300 border border-white/5 hover:border-accent-gold"
              aria-label="WhatsApp Contact"
            >
              <WhatsappIcon className="w-4 h-4" />
            </a>
          </div>

          {/* Copyright notice */}
          <p className="text-[10px] text-text-muted font-light tracking-widest text-center sm:text-left">
            © 2025 FS Visual. All rights reserved.
          </p>

          {/* Scroll back to top button */}
          <button
            onClick={scrollToTop}
            className="p-3 bg-bg-primary border border-white/5 hover:border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-bg-primary transition-all duration-300 rounded-none group"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>

      </div>
    </footer>
  );
}
