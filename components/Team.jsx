"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Import local team images
import farazImg from "@/images/farazAlam_PhotographerEditor.jpg";
import waqarImg from "@/images/waqarPhotoGrapherCinematographer.jpg";
import moizImg from "@/images/moizAlamSeniorPhotographerVideographer.jpg";
import ibrahimImg from "@/images/ibrahimCinematographer.jpg";
import shariqImg from "@/images/shariqShahzadPhotographerEditor.jpg";
import usmanImg from "@/images/usmanVideoEditor.jpg";
import raeesImg from "@/images/RaeesPhotoEdiror.jpg";
import hassanImg from "@/images/hassanPhotoGrapherCinematographer.jpg";



const teamMembers = [
  {
    name: "Faraz Alam",
    role: "Photographer & Editor",
    specialty: "Creative Direction & Fine Art",
    bio: "Founding visionary of FS Visuals. Dedicated to sculpting with light and freezing emotional moments in timeless frames.",
    image: farazImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:faraz@fsvisual.com"
  },
  {
    name: "Shariq Shahzad",
    role: "Photographer & Editor",
    specialty: "High-End Event Capture",
    bio: "Ensures visual composition is flawless from shooting on-site to post-processing for a stunning luxury final gallery.",
    image: shariqImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:shariq@fsvisual.com"
  },
  {
    name: "Usman Mushtaq",
    role: "Video Editor",
    specialty: "Cinematic Editing & Pacing",
    bio: "Transforms hours of raw footage into elegant highlight reels and emotional wedding films with matching sound design.",
    image: usmanImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:usman@fsvisual.com"
  },
  {
    name: "Raees Sheikh",
    role: "Photo Editor",
    specialty: "Color Correction & Retouching",
    bio: "Meticulous retoucher who handles detailed color correction and styling, giving every photo its final luxury grade.",
    image: raeesImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:raees@fsvisual.com"
  },
  {
    name: "Hassan",
    role: "Photographer & Cinematographer",
    specialty: "Cinematography & Portraits",
    bio: "Captures beautiful candid frames and cinematic sequences, preserving raw emotions with high-end framing.",
    image: hassanImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:hassan@fsvisual.com"
  },
  {
    name: "Ibrahim",
    role: "Cinematographer",
    specialty: "Cinematic Movement",
    bio: "Specializes in dynamic cinematic camera movement, gimbal techniques, and capturing grand events.",
    image: ibrahimImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:ibrahim@fsvisual.com"
  },
  {
    name: "Waqar",
    role: "Photographer & Cinematographer",
    specialty: "Cinematography & Portraits",
    bio: "Master of visual framing. Seamlessly blends traditional portrait photography with modern cinematic videography techniques.",
    image: waqarImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:waqar@fsvisual.com"
  },
  {
    name: "Moiz Alam",
    role: "Senior Photographer, Videographer & Editor",
    specialty: "Candid & Documentary Capture",
    bio: "Captures natural raw expressions, laughter, and behind-the-scenes moments that often go unnoticed but tell the true story.",
    image: moizImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:moiz@fsvisual.com",
    imageClass: "object-[35%_top] scale-[1.75] origin-[35%_top] group-hover:scale-[1.82]"
  }
];

export default function Team() {
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      ".team-anim",
      { opacity: 0, y: 55 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
      }
    );
  }, []);

  return (
    <section
      id="team"
      ref={containerRef}
      className="relative py-24 md:py-32 bg-bg-primary overflow-hidden"
    >
      {/* Subtle Background Radial Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.02)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="team-anim text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-xs font-semibold tracking-[0.3em] text-accent-gold uppercase mb-3 block">
            Creative Minds
          </span>
          <h2 className="serif-heading text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Meet Our Team
          </h2>
          <div className="w-12 h-[1px] bg-accent-gold mx-auto mb-6" />
          <p className="text-text-muted text-sm md:text-base font-light">
            The dedicated artists, technicians, and storytellers who bring cinematic depth and fine-art precision to your cherished wedding events.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="team-anim glass-card group flex flex-col overflow-hidden border border-white/5 bg-bg-secondary/40 relative hover:border-accent-gold/40 transition-colors duration-500"
            >
              {/* Photo Wrapper */}
              <div className="relative aspect-[4/5] overflow-hidden w-full bg-black">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  placeholder="blur"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={`object-cover transition-transform duration-700 ease-out filter grayscale group-hover:grayscale-0 ${member.imageClass || "object-center group-hover:scale-105"}`}
                />
                
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-60" />


              </div>

              {/* Bio Details */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-accent-gold block mb-2">
                    {member.role}
                  </span>
                  <h3 className="serif-heading text-lg font-bold text-text-primary mb-1">
                    {member.name}
                  </h3>
                  <span className="text-[11px] font-medium italic text-accent-warm block mb-3">
                    Specialty: {member.specialty}
                  </span>
                  <p className="text-text-muted text-xs font-light leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
