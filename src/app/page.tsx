import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveStats } from "@/components/landing/LiveStats";
import { FeaturedSongs } from "@/components/landing/FeaturedSongs";
import { WhyCasper } from "@/components/landing/WhyCasper";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sr-black">
      <HeroSection />
      <HowItWorks />
      <LiveStats />
      <FeaturedSongs />
      <WhyCasper />
      <Footer />
    </main>
  );
}
