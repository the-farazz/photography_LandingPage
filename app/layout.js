import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import LenisProvider from "@/components/LenisProvider";
import { JsonLd } from "@/components/JsonLd";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://thefsvisuals.com"),

  applicationName: "FS Visuals",

  title: "FS Visuals | Cinematic Wedding Photography Karachi",

description:
  "FS Visuals is a premium wedding photography and cinematic filmmaking studio based in Karachi, Pakistan, founded and led by Faraz Alam, a professional wedding photographer and cinematic editor dedicated to capturing timeless wedding stories through cinematic visuals.",
   keywords: [
    "Wedding Photographer Karachi",
    "Wedding Photography Karachi",
    "Wedding Videography Karachi",
    "Wedding Photography Pakistan",
    "Luxury Wedding Photography",
    "Cinematic Wedding Films",
    "Nikkah Photography",
    "Engagement Photography",
    "Bridal Photography",
    "FS Visuals",
  ],

  authors: [
    {
      name: "FS Visuals",
      url: "https://thefsvisuals.com",
    },
  ],

  creator: "FS Visuals",

  publisher: "FS Visuals",

  category: "Photography",

  alternates: {
    canonical: "https://thefsvisuals.com",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    title: "FS Visuals | Cinematic Wedding Photography Karachi",
description:
  "FS Visuals is a premium wedding photography and cinematic filmmaking studio based in Karachi, Pakistan, founded and led by Faraz Alam, specializing in timeless wedding storytelling through cinematic visuals.",
    url: "https://thefsvisuals.com",
    siteName: "FS Visuals",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "FS Visuals - Cinematic Wedding Photography",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "FS Visuals | Cinematic Wedding Photography Karachi",
description:
  "FS Visuals captures your wedding, engagement, and Nikkah moments with a luxury cinematic touch in Karachi.",
   images: ["/og-image.jpeg"],
  },

  verification: {
    google: "alQ_LMMUJk1gBSRF8AUrngtvoCuUS4yH5FDmbn-GwQ0",
  },
};

export const viewport = {
  themeColor: "#c9a84c",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",

  name: "FS Visuals",

  url: "https://thefsvisuals.com",

  image: "https://thefsvisuals.com/icon.svg",

  description:
    "FS Visuals captures weddings, engagements, and Nikkah ceremonies with luxury photography and cinematic filmmaking in Karachi, Pakistan.",

  telephone: "+923273129464",

  areaServed: {
    "@type": "City",
    name: "Karachi",
  },

  founder: {
    "@type": "Person",
    name: "Faraz Alam",
    jobTitle: "Founder, Lead Wedding Photographer & Cinematic Editor",
    url: "https://thefsvisuals.com",
    sameAs: [
      "https://www.instagram.com/the_fs_visuals/",
      "https://www.facebook.com/the.fs.visuals",
      "https://www.tiktok.com/@the_fs_visuals"
    ]
  },
  owner: {
    "@type": "Person",
    name: "Faraz Alam",
  },
  foundingDate: "2020",

  employee: {
    "@type": "Person",
    name: "Faraz Alam",
    jobTitle: "Founder, Lead Wedding Photographer & Cinematic Editor",
  },

  address: {
    "@type": "PostalAddress",
    addressLocality: "Karachi",
    addressRegion: "Sindh",
    addressCountry: "PK",
  },

  serviceType: [
    "Wedding Photography",
    "Wedding Videography",
    "Cinematic Wedding Films",
    "Nikkah Photography",
    "Engagement Photography",
    "Bridal Photography",
  ],

  sameAs: [
    "https://wa.me/923273129464",
    "https://www.instagram.com/the_fs_visuals/",
    "https://www.facebook.com/the.fs.visuals",
    "https://www.tiktok.com/@the_fs_visuals",
    "mailto:the.fs.visualss@gmail.com",
  ],
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased text-text-primary bg-bg-primary relative`}
      >
        <JsonLd data={jsonLd} />
        {/* Subtle Film Grain Overlay across all pages */}
        <div className="film-grain" />
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
