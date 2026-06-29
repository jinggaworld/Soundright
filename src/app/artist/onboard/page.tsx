import { OnboardingWizard } from "@/components/artist/onboard/OnboardingWizard";

export const metadata = {
  title: "Artist Onboarding | SoundRight",
  description: "Connect your Spotify account and tokenize your music on Casper Network.",
};

export default function ArtistOnboardPage() {
  return (
    <main className="min-h-screen bg-sr-black px-4 py-12">
      <OnboardingWizard />
    </main>
  );
}
