"use client";
import { useEffect, useRef } from "react";
import { Star, Quote } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Testimonials() {
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      ".testimonials-header",
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  const testimonials = [
    {
      quote: "FS Visual captured our Baraat so beautifully. The cinematic wedding film felt like a Bollywood dream. When we watched the highlight reel with our families, everyone had tears in their eyes. Truly a cinematic safar!",
      name: "Zainab & Bilal",
      event: "Baraat Ceremony, Karachi",
      rating: 5,
    },
    {
      quote: "For our intimate Nikkah, we wanted something moody yet elegant. The photographers were incredibly respectful, capturing the quiet prayers and raw joy. The final hand-bound leather album is absolute luxury.",
      name: "Sarah & Haris",
      event: "Nikkah Event, Karachi",
      rating: 5,
    },
    {
      quote: "The energy of our Shendi was unmatched, and the team captured every dance move and laughter. The drone shots of our outdoor reception were breathtaking. FS Visual has an outstanding creative vision.",
      name: "Ayesha & Hamza",
      event: "Shendi Celebration, Karachi",
      rating: 5,
    },
    {
      quote: "They made us feel incredibly comfortable in front of the camera, especially since we are both camera-shy. The color grading on the final portraits is spectacular, making every frame feel like art.",
      name: "Fatima & Omer",
      event: "Engagement Portrait, Karachi",
      rating: 5,
    },
    {
      quote: "From our first consultation to the delivery of the wedding films, the service was pure luxury. They really know how to capture family emotions and traditional moments. We will cherish this forever.",
      name: "Alizeh & Saad",
      event: "Valima Ceremony, Karachi",
      rating: 5,
    },
  ];

  // We duplicate the list to make the infinite marquee loop seamless
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section
      id="testimonials"
      ref={containerRef}
      className="relative py-24 md:py-32 bg-bg-primary overflow-hidden"
    >
      {/* Styles for horizontal auto scroll */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container:hover .marquee-track {
          animation-play-state: paused;
        }
      `}} />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="testimonials-header text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-xs font-semibold tracking-[0.3em] text-accent-gold uppercase mb-3 block">
            Love Letters
          </span>
          <h2 className="serif-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            What Our Clients Say
          </h2>
          <div className="w-12 h-[1px] bg-accent-gold mx-auto mb-6" />
          <p className="text-text-muted text-sm md:text-base font-light">
            Real couples, real emotions. Read the stories of those who entrusted us with their most precious life chapters.
          </p>
        </div>
      </div>

      {/* Infinite Horizontal Scroll Marquee */}
      <div className="marquee-container relative w-full overflow-hidden py-4 mask-gradient-overlay">
        {/* Shadow overlays for smooth fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

        <div 
          className="marquee-track flex gap-6 w-max"
          style={{ animation: "marquee 45s linear infinite" }}
        >
          {duplicatedTestimonials.map((t, idx) => (
            <div
              key={idx}
              className="glass-card w-[350px] md:w-[420px] p-8 md:p-10 border border-white/5 flex flex-col justify-between hover:border-accent-gold/20 hover:bg-bg-secondary/90 transition-all duration-300 select-none"
            >
              <div>
                {/* Quote Icon & Rating */}
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-bg-secondary border border-white/5 text-accent-gold rounded-full">
                    <Quote className="w-4 h-4 transform rotate-180" />
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-accent-gold text-accent-gold" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-text-primary/90 text-sm md:text-base font-light italic leading-relaxed mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Client Profile */}
              <div className="border-t border-white/5 pt-6 flex flex-col">
                <span className="serif-heading text-lg font-bold text-accent-gold tracking-wide">
                  {t.name}
                </span>
                <span className="text-[11px] tracking-wider text-text-muted mt-1 uppercase">
                  {t.event}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
