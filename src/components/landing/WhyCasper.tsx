import { Shield, Zap, Globe, Lock } from "lucide-react";

const features = [
  {
    icon: <Shield size={24} />,
    title: "Casper Network",
    description:
      "Enterprise-grade blockchain built for scalability and security. Low fees, fast finality.",
  },
  {
    icon: <Zap size={24} />,
    title: "x402 Payments",
    description:
      "HTTP 402 micropayments for seamless token purchases. No complex wallet setup.",
  },
  {
    icon: <Globe size={24} />,
    title: "Fully On-Chain",
    description:
      "All royalty distributions, token transfers, and compliance records are transparent on-chain.",
  },
  {
    icon: <Lock size={24} />,
    title: "AI Verified",
    description:
      "Every play count and royalty calculation is verified by AI before distribution.",
  },
];

export function WhyCasper() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-sr-text">
          Why Casper Network
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div key={i} className="card-sr text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sr-green/20 text-sr-green">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-bold text-sr-text">
                {feature.title}
              </h3>
              <p className="text-sm text-sr-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
