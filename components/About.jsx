"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function About() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Fade-in right text section content
    gsap.fromTo(
      ".about-text-anim",
      { opacity: 0, x: 50 },
      {
        opacity: 1,
        x: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      }
    );

    // Parallax zoom effect for left image
    gsap.fromTo(
      imageRef.current,
      { scale: 1.15, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1.5,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      }
    );

    // Counter animations
    const counters = document.querySelectorAll(".stat-counter");
    counters.forEach((counter) => {
      const targetVal = parseInt(counter.getAttribute("data-target"), 10);
      const countObj = { val: 0 };

      gsap.to(countObj, {
        val: targetVal,
        duration: 2.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: counter,
          start: "top 90%",
          toggleActions: "play none none none",
        },
        onUpdate: () => {
          counter.textContent = Math.floor(countObj.val);
        },
      });
    });
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-16 md:py-20 bg-bg-secondary overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Left Side: Cinematic Image Column */}
          <div className="lg:col-span-5 relative group">
            <div className="relative aspect-[3/4] overflow-hidden border border-white/5 shadow-2xl">
              {/* Outer Golden Accented Border Effect */}
              <div className="absolute inset-0 border border-accent-gold/20 transform translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500" />
              
              <Image
                ref={imageRef}
                src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1000"
                alt="Behind the scenes wedding capture in Karachi"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-40" />
            </div>

            {/* Float badge */}
            <div className="absolute bottom-6 -right-4 bg-accent-gold p-6 text-bg-primary shadow-xl max-w-[200px] border border-accent-warm/20 hidden sm:block">
              <span className="serif-heading text-4xl font-bold tracking-tight block mb-1">FSV</span>
              <p className="text-[10px] uppercase font-bold tracking-widest leading-normal">
                Legacy Fine Art Photography
              </p>
            </div>
          </div>

          {/* Right Side: Professional Copy Column */}
          <div className="lg:col-span-7 about-text-anim flex flex-col justify-center">
            <span className="text-xs font-semibold tracking-[0.3em] text-accent-gold uppercase mb-3 block">
              Our Journey
            </span>
            <h2 className="serif-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
              Preserving Your Heritage, One Frame at a Time.
            </h2>
            
            <p className="text-text-muted text-sm md:text-base font-light leading-relaxed mb-6">
              Founded in the heart of Karachi, FS Visuals was born out of a profound passion for visual 
              storytelling. We believe that a wedding isn&apos;t just an event; it&apos;s a cinematic tapestry woven 
              with emotions, family bonds, and centuries-old cultural heritage. From the delicate application 
              of mehndi to the dramatic teardrops of rukhsati, our lenses document the soul of Pakistani events.
            </p>

            <p className="text-text-muted text-sm md:text-base font-light leading-relaxed mb-10">
              For over half a decade, our specialized team of creative cinematographers and fine-art photographers 
              have crisscrossed the country to record love stories. We combine state-of-the-art camera systems 
              with custom, emotional color grading to capture authentic moments that stand out for generations.
            </p>

            {/* Stat Counters Row */}
            <div className="grid grid-cols-3 gap-6 sm:gap-8 pt-8 border-t border-white/5">
              <div>
                <div className="flex items-baseline">
                  <span
                    className="stat-counter serif-heading text-3xl sm:text-5xl font-bold text-accent-gold tracking-tight"
                    data-target="200"
                  >
                    0
                  </span>
                  <span className="serif-heading text-2xl sm:text-3xl font-bold text-accent-gold">+</span>
                </div>
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-text-muted mt-2">
                  Weddings
                </p>
              </div>

              <div>
                <div className="flex items-baseline">
                  <span
                    className="stat-counter serif-heading text-3xl sm:text-5xl font-bold text-accent-gold tracking-tight"
                    data-target="5"
                  >
                    0
                  </span>
                  <span className="serif-heading text-2xl sm:text-3xl font-bold text-accent-gold">+</span>
                </div>
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-text-muted mt-2">
                  Years Exp
                </p>
              </div>

              <div>
                <div className="flex items-baseline">
                  <span
                    className="stat-counter serif-heading text-3xl sm:text-5xl font-bold text-accent-gold tracking-tight"
                    data-target="1000"
                  >
                    0
                  </span>
                  <span className="serif-heading text-2xl sm:text-3xl font-bold text-accent-gold">+</span>
                </div>
                <p className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-text-muted mt-2">
                  Happy Clients
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
