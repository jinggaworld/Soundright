import Link from "next/link";
import { ArrowRight, Music, TrendingUp, Users } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sr-green/10 to-transparent" />

      <div className="relative mx-auto max-w-5xl text-center">
        <h1 className="mb-6 text-5xl font-bold text-sr-text md:text-7xl">
          Own a Piece of{" "}
          <span className="text-sr-green">Music</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-sr-text-secondary">
          Tokenize music royalties on Casper Network. Investors buy tokens
          representing a % of royalties. AI-powered verification. x402
          micropayments. Fully on-chain.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/artist/onboard"
            className="btn-pill flex items-center gap-2 bg-sr-green text-black hover:bg-sr-green/80"
          >
            I&apos;m an Artist
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/marketplace"
            className="btn-pill flex items-center gap-2 border border-sr-border text-sr-text hover:bg-sr-mid"
          >
            I&apos;m an Investor
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-sr-text-secondary">
          <div className="flex items-center gap-2">
            <Music size={16} className="text-sr-green" />
            <span>Real Spotify Data</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-sr-green" />
            <span>AI Verified</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-sr-green" />
            <span>On-Chain Transparent</span>
          </div>
        </div>
      </div>
    </section>
  );
}
