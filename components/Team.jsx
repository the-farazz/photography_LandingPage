"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Import local team images
import farazImg from "@/images/farazPhotographerEditor.jpg";
import waqarImg from "@/images/waqarPhotoGrapherCinematographer.jpg";
import moizImg from "@/images/moizAlamSeniorPhotographerVideographer.jpg";
import ibrahimImg from "@/images/ibrahimCinematographer.jpg";
import shariqImg from "@/images/shariqPhotographerEditor.jpg";
import usmanImg from "@/images/usmanVideoEditor.jpg";
import raeesImg from "@/images/RaeesPhotoEdiror.jpg";

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

const teamMembers = [
  {
    name: "Faraz Siddiqui",
    role: "Photographer & Editor",
    specialty: "Creative Direction & Fine Art",
    bio: "Founding visionary of FS Visuals. Dedicated to sculpting with light and freezing emotional moments in timeless frames.",
    image: farazImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:faraz@fsvisual.com"
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
    role: "Senior Photographer & Videographer",
    specialty: "Candid & Documentary Capture",
    bio: "Captures natural raw expressions, laughter, and behind-the-scenes moments that often go unnoticed but tell the true story.",
    image: moizImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:moiz@fsvisual.com"
  },
  {
    name: "Ibrahim",
    role: "Cinematographer",
    specialty: "Cinematic Movement & Drone",
    bio: "Specializes in dynamic cinematic camera movement, gimbal techniques, and dramatic drone perspectives of grand events.",
    image: ibrahimImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:ibrahim@fsvisual.com"
  },
  {
    name: "Shariq",
    role: "Photographer & Editor",
    specialty: "High-End Event Capture",
    bio: "Ensures visual composition is flawless from shooting on-site to post-processing for a stunning luxury final gallery.",
    image: shariqImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:shariq@fsvisual.com"
  },
  {
    name: "Usman",
    role: "Video Editor",
    specialty: "Cinematic Editing & Pacing",
    bio: "Transforms hours of raw footage into elegant highlight reels and emotional wedding films with matching sound design.",
    image: usmanImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:usman@fsvisual.com"
  },
  {
    name: "Raees",
    role: "Photo Editor",
    specialty: "Color Correction & Retouching",
    bio: "Meticulous retoucher who handles detailed color correction and styling, giving every photo its final luxury grade.",
    image: raeesImg,
    instagram: "https://www.instagram.com/the_fs_visuals/",
    whatsapp: "https://wa.me/923001234567",
    email: "mailto:raees@fsvisual.com"
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
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 filter grayscale group-hover:grayscale-0"
                />
                
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-60" />

                {/* Social Links Popover Hover Effect */}
                <div className="absolute bottom-4 right-4 flex flex-col space-y-2 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-bg-primary/95 text-text-muted hover:text-accent-gold hover:bg-bg-primary transition-all rounded-none border border-white/5"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href={member.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-bg-primary/95 text-text-muted hover:text-accent-gold hover:bg-bg-primary transition-all rounded-none border border-white/5"
                    aria-label="WhatsApp"
                  >
                    <WhatsappIcon className="w-4 h-4" />
                  </a>
                  <a
                    href={member.email}
                    className="p-2 bg-bg-primary/95 text-text-muted hover:text-accent-gold hover:bg-bg-primary transition-all rounded-none border border-white/5"
                    aria-label="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
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
