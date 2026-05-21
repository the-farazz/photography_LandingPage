"use client";
import { useEffect, useRef } from "react";
import { Camera, Film, Sliders } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Services() {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    // Register scrolltrigger safely
    gsap.registerPlugin(ScrollTrigger);

    // Animating the heading and section content
    gsap.fromTo(
      ".services-title-anim",
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      }
    );

    // Animating cards with stagger
    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.0,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
      }
    );
  }, []);

  const services = [
    {
      num: "01",
      icon: Camera,
      title: "Wedding Photography",
      desc: "Capturing the raw emotions, timeless portraits, and split-second candid moments that define your celebration. From Nikkah signatures to high-energy baraat entrances, we preserve your heritage in striking clarity.",
      features: ["Candid & Traditional Coverage", "Editorial Bride & Groom Portraits", "Family Formals & Ceremony Details"],
    },
    {
      num: "02",
      icon: Film,
      title: "Cinematic Videography",
      desc: "Story-driven high-definition wedding films that feel like cinema. We blend beautiful ambient sounds, emotional speeches, and professional cinematography to craft a film that makes you relive the romance every single time.",
      features: ["4K Ultra-HD Cinematography", "Creative Direction & Sound Design", "Aerial Drone Footage (Vows & Venues)"],
    },
    {
      num: "03",
      icon: Sliders,
      title: "Post-Production & Editing",
      desc: "Our creative signature lies in the editing room. We color grade every photograph and construct cohesive story arcs for your highlight reels. We also design luxury handmade physical photo albums.",
      features: ["Custom Cinematic Color Grading", "Engagement & Highlight Reels", "Fine Art Coffee Table Books"],
    },
  ];

  return (
    <section
      id="services"
      ref={containerRef}
      className="relative py-16 md:py-20 bg-bg-secondary overflow-hidden"
    >
      {/* Background design elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(232,213,163,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12 services-title-anim">
          <span className="text-xs font-semibold tracking-[0.3em] text-accent-gold uppercase mb-3 block">
            Crafting Legends
          </span>
          <h2 className="serif-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            What We Create
          </h2>
          <div className="w-12 h-[1px] bg-accent-gold mx-auto mb-6" />
          <p className="text-text-muted text-sm md:text-base font-light leading-relaxed">
            Every event is a unique narrative. We offer fully integrated visual production services 
            tailored to Pakistani event traditions, combining technical precision with artistic emotion.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                ref={(el) => (cardsRef.current[index] = el)}
                className="glass-card group p-8 md:p-10 relative flex flex-col justify-between transition-all duration-500 border border-white/5 hover:border-accent-gold/40 hover:shadow-[0_15px_40px_rgba(201,168,76,0.08)]"
              >
                {/* Gold glow top border on hover */}
                <div className="absolute top-0 left-0 w-0 h-[2px] bg-gradient-to-r from-accent-gold to-accent-warm transition-all duration-500 group-hover:w-full" />
                
                <div>
                  {/* Number & Icon header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-4 bg-bg-primary/80 border border-white/5 group-hover:border-accent-gold/30 transition-all duration-500 rounded-none text-accent-gold">
                      <Icon className="w-6 h-6 transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <span className="serif-heading text-3xl font-light text-text-muted/20 group-hover:text-accent-gold/30 transition-colors duration-500">
                      {service.num}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="serif-heading text-2xl font-bold text-text-primary mb-4 tracking-wide group-hover:text-accent-gold transition-colors duration-300">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-text-muted text-sm font-light leading-relaxed mb-8">
                    {service.desc}
                  </p>
                </div>

                {/* Features list */}
                <ul className="space-y-3 pt-6 border-t border-white/5">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-xs text-text-primary/70">
                      <span className="w-1.5 h-1.5 bg-accent-gold/60 rounded-full mr-2.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
