"use client";
import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Pricing() {
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      ".pricing-header",
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

    gsap.fromTo(
      ".pricing-card-anim",
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
      }
    );
  }, []);

  const tiers = [
    {
      name: "Silver",
      type: "Photography Only",
      price: "Rs. 150,000",
      period: "per event",
      desc: "Perfect for intimate events, pre-wedding shoots, or standalone photography coverage.",
      features: [
        "1 Senior Fine-Art Photographer",
        "Unlimited high-resolution digital edits",
        "Online gallery delivery within 4 weeks",
        "4 Hours of event coverage",
        "1 Standard physical photo book",
      ],
      popular: false,
      cta: "Select Silver",
    },
    {
      name: "Gold",
      type: "Photography & Videography",
      price: "Rs. 295,000",
      period: "per event",
      desc: "Our signature package capturing your wedding in complete cinematic harmony.",
      features: [
        "2 Senior Photographers & 2 Cinematographers",
        "1 Cinematic highlight film (3-5 mins)",
        "Full documentary edit of ceremony & dances",
        "1 Premium digital photo archive",
        "1 Large signature wedding album",
        "Full day event coverage (8 Hours)",
        "Subtle aerial drone coverage",
      ],
      popular: true,
      cta: "Select Gold",
    },
    {
      name: "Platinum",
      type: "Complete Visual Production",
      price: "Rs. 450,000",
      period: "per event",
      desc: "An ultimate visual production with maximum coverage, drone film, and luxury products.",
      features: [
        "3 Photographers & 3 Cinematographers",
        "1 Cinematic teaser + 1 Premium highlight film",
        "Full documentary wedding movie (4K)",
        "2 Premium duplicate family albums",
        "1 Luxury leather master album",
        "Complimentary pre-wedding or couple shoot",
        "Exclusive senior editing priority",
      ],
      popular: false,
      cta: "Select Platinum",
    },
  ];

  return (
    <section
      id="pricing"
      ref={containerRef}
      className="relative py-24 md:py-32 bg-bg-secondary overflow-hidden"
    >
      {/* Background ambient highlights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.02)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="pricing-header text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-xs font-semibold tracking-[0.3em] text-accent-gold uppercase mb-3 block">
            Investment
          </span>
          <h2 className="serif-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Our Packages
          </h2>
          <div className="w-12 h-[1px] bg-accent-gold mx-auto mb-6" />
          <p className="text-text-muted text-sm md:text-base font-light">
            Transparent pricing for fine-art services. Choose the canvas that matches your wedding dreams.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing-card-anim flex flex-col justify-between p-8 md:p-10 relative transition-all duration-500 border ${
                tier.popular
                  ? "bg-bg-primary border-accent-gold shadow-[0_20px_50px_rgba(201,168,76,0.15)] lg:scale-105 z-10"
                  : "glass-card border-white/5 hover:border-accent-gold/20"
              }`}
            >
              {/* Popularity Badge */}
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-accent-gold text-bg-primary text-[10px] font-bold tracking-widest uppercase rounded-full border border-accent-warm/20">
                  Most Popular
                </span>
              )}

              <div>
                {/* Header */}
                <div className="mb-8">
                  <span className="text-xs font-semibold tracking-[0.2em] text-accent-gold uppercase block mb-2">
                    {tier.type}
                  </span>
                  <h3 className="serif-heading text-3xl font-bold text-text-primary mb-4 tracking-wide">
                    {tier.name}
                  </h3>
                  <p className="text-text-muted text-xs font-light leading-relaxed min-h-[48px]">
                    {tier.desc}
                  </p>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline mb-8 border-b border-white/5 pb-8">
                  <span className="serif-heading text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs text-text-muted ml-2 tracking-wider">
                    / {tier.period}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-10">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-text-primary/80">
                      <Check className="w-4 h-4 text-accent-gold mr-3 mt-0.5 shrink-0" />
                      <span className="font-light leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Call to Action Button */}
              <div>
                <a
                  href="#contact"
                  className={`w-full text-center block py-4 text-xs font-bold tracking-widest uppercase transition-all duration-300 rounded-none border ${
                    tier.popular
                      ? "bg-accent-gold border-accent-gold text-bg-primary hover:bg-accent-warm hover:border-accent-warm shadow-md"
                      : "bg-transparent border-white/20 text-text-primary hover:border-accent-gold hover:text-accent-gold"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
