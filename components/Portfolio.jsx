"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play } from "lucide-react";

export default function Portfolio() {
  const [filter, setFilter] = useState("all");
  const containerRef = useRef(null);
  const gridRef = useRef(null);

  const items = [
    {
      id: 1,
      title: "The Golden Hour Vows",
      category: "photography",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
      size: "md:col-span-2 md:row-span-2",
      aspect: "aspect-[4/3] md:aspect-auto md:h-full",
    },
    {
      id: 2,
      title: "Karachi Heritage Nikkah",
      category: "photography",
      image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800",
      size: "md:col-span-1 md:row-span-1",
      aspect: "aspect-square",
    },
    {
      id: 3,
      title: "A Night of Sparkles",
      category: "videography",
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
      size: "md:col-span-1 md:row-span-2",
      aspect: "aspect-[3/4] md:aspect-auto md:h-full",
      isVideo: true,
    },
    {
      id: 4,
      title: "Symphony of Lights",
      category: "videography",
      image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800",
      size: "md:col-span-1 md:row-span-1",
      aspect: "aspect-square",
      isVideo: true,
    },
    {
      id: 5,
      title: "Elegance in Detail",
      category: "photography",
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
      size: "md:col-span-1 md:row-span-1",
      aspect: "aspect-square",
    },
    {
      id: 6,
      title: "Baraat Cinematic Opener",
      category: "videography",
      image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=800",
      size: "md:col-span-2 md:row-span-1",
      aspect: "aspect-[2/1] md:aspect-auto md:h-full",
      isVideo: true,
    },
  ];

  // GSAP initialization
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      ".portfolio-header",
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

  // Filter change animation
  useEffect(() => {
    gsap.fromTo(
      ".portfolio-item",
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" }
    );
  }, [filter]);

  const filteredItems = items.filter(
    (item) => filter === "all" || item.category === filter
  );

  return (
    <section
      id="portfolio"
      ref={containerRef}
      className="relative py-24 md:py-32 bg-bg-primary overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header and Filter Tabs */}
        <div className="portfolio-header flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-20 gap-8">
          <div>
            <span className="text-xs font-semibold tracking-[0.3em] text-accent-gold uppercase mb-3 block">
              Our Legacy
            </span>
            <h2 className="serif-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary">
              Our Work
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 border-b border-white/10 pb-2 md:pb-0">
            {["all", "photography", "videography"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-all duration-300 relative ${
                  filter === cat ? "text-accent-gold" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {cat}
                {filter === cat && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-gold" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid Gallery */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px] md:auto-rows-[300px]"
        >
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`portfolio-item relative overflow-hidden group border border-white/5 cursor-pointer ${item.size} ${item.aspect}`}
            >
              {/* Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />

              {/* Dark Overlay & Cinematic Hover Effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 md:p-8" />

              {/* Action Video Icon */}
              {item.isVideo && (
                <div className="absolute top-4 right-4 p-2 bg-accent-gold/90 text-bg-primary rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-400 ease-out">
                  <Play className="w-4 h-4 fill-current" />
                </div>
              )}

              {/* Text details shown on hover */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                <span className="text-[10px] font-semibold tracking-[0.25em] text-accent-gold uppercase mb-2 block">
                  {item.category === "photography" ? "Photography" : "Cinematography"}
                </span>
                <h3 className="serif-heading text-lg md:text-2xl font-bold text-text-primary">
                  {item.title}
                </h3>
              </div>
              
              {/* Decorative gold subtle frame on hover */}
              <div className="absolute inset-4 border border-accent-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
