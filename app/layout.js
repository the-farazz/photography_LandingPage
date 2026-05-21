import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import LenisProvider from "@/components/LenisProvider";

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
  title: "FS Visuals | Cinematic Wedding Photography & Videography Karachi",
  description: "FS Visuals captures your wedding, birthday, engagement, and Nikkah moments with a luxury, cinematic touch in Karachi, Pakistan. Aap ki yaadon ka cinematic safar.",
  openGraph: {
    title: "FS Visuals | Cinematic Wedding Photography & Videography Karachi",
    description: "Aap ki yaadon ka cinematic safar. High-end wedding films and photography in Karachi.",
    url: "https://fsvisuals.com",
    siteName: "FS Visuals",
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased text-text-primary bg-bg-primary relative`}
      >
        {/* Subtle Film Grain Overlay across all pages */}
        <div className="film-grain" />
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
