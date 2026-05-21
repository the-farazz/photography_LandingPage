"use client";
import { useState, useEffect, useRef } from "react";
import { Mail, MapPin, Instagram, Facebook, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import emailjs from "@emailjs/browser";

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

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      ".contact-anim",
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
      }
    );
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const templateParams = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      date: formData.date,
      message: formData.message,
    };

    Promise.all([
      // 1. Send inquiry email to FS Visuals
      emailjs.send(
        "service_xb8umvo",
        "template_ea7olvg",
        templateParams,
        "_iB-PeMQ35Yb5DPCX"
      ),
      // 2. Send auto-reply thank-you email to the customer
      emailjs.send(
        "service_xb8umvo",
        "template_50n78ud",
        templateParams,
        "_iB-PeMQ35Yb5DPCX"
      )
    ])
    .then(() => {
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", date: "", message: "" });
      setSubmitting(false);
    })
    .catch((err) => {
      console.error("EmailJS Error:", err);
      setError("Failed to send message. Please try again or contact us directly via WhatsApp.");
      setSubmitting(false);
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section
      id="contact"
      ref={containerRef}
      className="relative py-24 md:py-32 bg-bg-primary overflow-hidden"
    >
      {/* Background gradients */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="contact-anim text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-xs font-semibold tracking-[0.3em] text-accent-gold uppercase mb-3 block">
            Get In Touch
          </span>
          <h2 className="serif-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Let&apos;s Tell Your Story
          </h2>
          <div className="w-12 h-[1px] bg-accent-gold mx-auto mb-6" />
          <p className="text-text-muted text-sm md:text-base font-light">
            Have an upcoming celebration in Karachi or beyond? Fill out the brief form below, 
            or reach out directly. We would love to capture your journey.
          </p>
        </div>

        {/* Contact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Left Column: Contact Form */}
          <div className="lg:col-span-7 contact-anim">
            <div className="glass-card p-8 md:p-10 border border-white/5 relative">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="w-16 h-16 text-accent-gold mb-6 animate-pulse" />
                  <h3 className="serif-heading text-2xl md:text-3xl font-bold text-text-primary mb-3">
                    Thank You!
                  </h3>
                  <p className="text-text-muted text-sm font-light max-w-md">
                    Your wedding inquiry has been received. Our team will review the details and reach out to you via email or WhatsApp within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="flex flex-col">
                      <label htmlFor="name" className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="bg-bg-secondary/80 border border-white/10 px-4 py-3 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors duration-300 rounded-none"
                        placeholder="e.g. Faraz Alam"
                      />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col">
                      <label htmlFor="email" className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-bg-secondary/80 border border-white/10 px-4 py-3 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors duration-300 rounded-none"
                        placeholder="e.g. the.fs.visualss@gmail.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div className="flex flex-col">
                      <label htmlFor="phone" className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="bg-bg-secondary/80 border border-white/10 px-4 py-3 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors duration-300 rounded-none"
                        placeholder="e.g. +92 327 3129464"
                      />
                    </div>

                    {/* Event Date */}
                    <div className="flex flex-col">
                      <label htmlFor="date" className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-2">
                        Event Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        id="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        className="bg-bg-secondary/80 border border-white/10 px-4 py-3 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors duration-300 rounded-none"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="flex flex-col">
                    <label htmlFor="message" className="text-xs font-semibold tracking-wider text-text-muted uppercase mb-2">
                      Tell Us About Your Event *
                    </label>
                    <textarea
                      name="message"
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="bg-bg-secondary/80 border border-white/10 px-4 py-3 text-sm text-text-primary focus:border-accent-gold focus:outline-none transition-colors duration-300 rounded-none resize-none"
                      placeholder="Share details about the venue, gathering size, custom requirements, and your vision..."
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-light text-center">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-accent-gold text-bg-primary text-xs font-bold tracking-widest uppercase hover:bg-accent-warm transition-all duration-300 rounded-none flex items-center justify-center gap-2 border border-accent-gold relative overflow-hidden group shadow-lg shadow-accent-gold/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {submitting ? "Sending..." : "Send Message"} <Send className="w-3.5 h-3.5" />
                    </span>
                    <span className="absolute inset-0 bg-accent-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Direct Info & Social Media Links */}
          <div className="lg:col-span-5 contact-anim flex flex-col justify-between space-y-12">
            
            {/* Info details */}
            <div className="space-y-8">
              <h3 className="serif-heading text-2xl font-bold text-text-primary tracking-wide mb-6">
                Studio Details
              </h3>

              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-bg-secondary border border-white/5 text-accent-gold rounded-none">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase text-text-muted mb-1">
                    Location
                  </h4>
                  <p className="text-sm font-light text-text-primary">
                    Orangi Town, Karachi, Pakistan.
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-bg-secondary border border-white/5 text-accent-gold rounded-none">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase text-text-muted mb-1">
                    Email
                  </h4>
                  <a
                    href="mailto:the.fs.visualss@gmail.com"
                    className="text-sm font-light text-text-primary hover:text-accent-gold transition-colors"
                  >
                    the.fs.visualss@gmail.com
                  </a>
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-bg-secondary border border-white/5 text-accent-gold rounded-none">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase text-text-muted mb-1">
                    Instagram
                  </h4>
                  <a
                    href="https://www.instagram.com/the_fs_visuals/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-light text-text-primary hover:text-accent-gold transition-colors"
                  >
                    @the_fs_visuals
                  </a>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-bg-secondary border border-white/5 text-accent-gold rounded-none">
                  <Facebook className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase text-text-muted mb-1">
                    Facebook
                  </h4>
                  <a
                    href="https://www.facebook.com/the.fs.visuals"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-light text-text-primary hover:text-accent-gold transition-colors"
                  >
                    @the.fs.visuals
                  </a>
                </div>
              </div>

              {/* TikTok */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-bg-secondary border border-white/5 text-accent-gold rounded-none">
                  <TiktokIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-widest uppercase text-text-muted mb-1">
                    TikTok
                  </h4>
                  <a
                    href="https://www.tiktok.com/@the_fs_visuals"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-light text-text-primary hover:text-accent-gold transition-colors"
                  >
                    @the_fs_visuals
                  </a>
                </div>
              </div>
            </div>

            {/* WhatsApp Call to Action */}
            <div className="glass-card p-8 border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="serif-heading text-xl font-bold text-text-primary mb-2">
                  Need an Instant Quote?
                </h4>
                <p className="text-text-muted text-xs font-light leading-relaxed mb-6">
                  Chat directly with our director on WhatsApp. We can discuss availability and outline a quick customized layout for your dates.
                </p>
              </div>

              <a
                href="https://wa.me/923273129464"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-emerald-600 text-text-primary text-xs font-bold tracking-widest uppercase hover:bg-emerald-700 transition-all duration-300 rounded-none flex items-center justify-center gap-2 border border-emerald-600 relative overflow-hidden group shadow-lg shadow-emerald-600/10"
              >
                <WhatsappIcon className="w-4 h-4" /> Chat with Us
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
