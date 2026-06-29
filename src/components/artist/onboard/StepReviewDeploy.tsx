"use client";

import { useState } from "react";
import type { OnboardingData } from "./OnboardingWizard";

interface StepProps {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TokenizeResult {
  song: {
    id: string;
    title: string;
    status: string;
    complianceHash: string;
    isVerified: boolean;
  };
  nextSteps: string[];
}

export function StepReviewDeploy({ formData, onBack }: StepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TokenizeResult | null>(null);

  const salePercentage = Math.round((formData.tokensForSale / formData.totalSupply) * 100);
  const artistRevenue = formData.tokensForSale * formData.pricePerToken;

  const handleTokenize = async () => {
    if (!formData.artistId || !formData.selectedTrack) {
      setError("Missing artist or track information. Please go back and complete previous steps.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/songs/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: formData.artistId,
          spotifyTrackId: formData.selectedTrack.id,
          title: formData.title,
          isrcCode: formData.isrcCode,
          totalSupply: formData.totalSupply,
          tokensForSale: formData.tokensForSale,
          pricePerToken: formData.pricePerToken,
          royaltyRatePerMille: formData.royaltyRatePerMille,
          distributionSchedule: formData.distributionSchedule,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to tokenize song");
        return;
      }

      setResult(data.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (result) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sr-green/20">
          <svg className="h-8 w-8 text-sr-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-sr-text">Song Registered Successfully!</h3>
        <p className="text-sr-text-secondary">
          &quot;{result.song.title}&quot; has been submitted for AI compliance verification.
        </p>
        <div className="rounded-lg bg-sr-mid/50 p-4 text-left">
          <p className="mb-2 text-sm font-medium text-sr-text">Status: {result.song.status}</p>
          <p className="mb-2 text-xs text-sr-text-secondary">
            Compliance Hash: {result.song.complianceHash.slice(0, 16)}...
          </p>
          <p className="text-xs text-sr-text-secondary">
            Verified: {result.song.isVerified ? "✓ Yes" : "⏳ Pending"}
          </p>
        </div>
        <div className="rounded-lg bg-sr-mid/30 p-4 text-left">
          <p className="mb-2 text-sm font-medium text-sr-text">Next Steps:</p>
          <ul className="space-y-1">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="text-xs text-sr-text-secondary">
                {i + 1}. {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sr-text-secondary">
        Review your configuration before submitting for tokenization.
      </p>

      {/* Summary card */}
      <div className="space-y-4 rounded-lg bg-sr-mid/50 p-4">
        {/* Song info */}
        <div className="flex items-center gap-3">
          {formData.selectedTrack?.albumArt && (
            <img src={formData.selectedTrack.albumArt} alt="" className="h-14 w-14 rounded object-cover" />
          )}
          <div>
            <p className="font-bold text-sr-text">{formData.title}</p>
            <p className="text-sm text-sr-text-secondary">{formData.spotifyProfile?.name}</p>
          </div>
        </div>

        <hr className="border-sr-border" />

        {/* Token config */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-sr-text-secondary">Total Supply</p>
            <p className="font-medium text-sr-text">{formData.totalSupply.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sr-text-secondary">For Sale</p>
            <p className="font-medium text-sr-text">
              {formData.tokensForSale.toLocaleString()} ({salePercentage}%)
            </p>
          </div>
          <div>
            <p className="text-sr-text-secondary">Price per Token</p>
            <p className="font-medium text-sr-text">{formData.pricePerToken} CSPR</p>
          </div>
          <div>
            <p className="text-sr-text-secondary">Royalty Rate</p>
            <p className="font-medium text-sr-text">
              {(formData.royaltyRatePerMille / 10).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sr-text-secondary">Schedule</p>
            <p className="font-medium capitalize text-sr-text">{formData.distributionSchedule}</p>
          </div>
          <div>
            <p className="text-sr-text-secondary">Est. Revenue</p>
            <p className="font-bold text-sr-green">{artistRevenue.toLocaleString()} CSPR</p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-pill border border-sr-border text-sr-text-secondary hover:bg-sr-mid">
          ← Back
        </button>
        <button
          onClick={handleTokenize}
          disabled={loading}
          className="btn-pill bg-sr-green text-black hover:bg-sr-green/80 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "🚀 Submit for Tokenization"}
        </button>
      </div>
    </div>
  );
}
