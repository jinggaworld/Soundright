import { Upload, Coins, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: <Upload size={32} />,
    title: "Artist Tokenizes Song",
    description:
      "Connect Spotify, select a song, define token structure. AI verifies data integrity.",
  },
  {
    icon: <Coins size={32} />,
    title: "Investors Buy Tokens",
    description:
      "Browse marketplace, buy tokens via x402. Own a % of the song's royalties.",
  },
  {
    icon: <TrendingUp size={32} />,
    title: "Royalties Distributed Weekly",
    description:
      "AI pulls real Spotify data, calculates royalties, distributes automatically on-chain.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-sr-text">
          How It Works
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="card-sr text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sr-green/20 text-sr-green">
                {step.icon}
              </div>
              <div className="mb-2 text-sm font-bold text-sr-green">
                Step {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-bold text-sr-text">
                {step.title}
              </h3>
              <p className="text-sm text-sr-text-secondary">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
