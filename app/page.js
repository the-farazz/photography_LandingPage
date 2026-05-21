import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Portfolio from "@/components/Portfolio";
import About from "@/components/About";
import Team from "@/components/Team";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-bg-primary overflow-x-hidden selection:bg-accent-gold selection:text-bg-primary">
      {/* Sticky Header Navigation */}
      <Navbar />

      {/* Main Single Page Sections */}
      <main>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. Services Section */}
        <Services />

        {/* 3. Portfolio Section */}
        <Portfolio />

        {/* 4. About Section */}
        <About />

        {/* 5. Team Section */}
        <Team />

        {/* 6. Testimonials Section */}
        <Testimonials />

        {/* 7. Pricing Section */}
        <Pricing />

        {/* 8. Contact Section */}
        <Contact />
      </main>

      {/* Footer Section */}
      <Footer />
    </div>
  );
}
