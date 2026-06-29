"use client";

import { useState } from "react";
import type { OnboardingData } from "./OnboardingWizard";

interface StepProps {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepConnectSpotify({
  formData,
  updateFormData,
  onNext,
  onBack,
}: StepProps) {
  const [spotifyUrl, setSpotifyUrl] = useState(formData.spotifyArtistId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!spotifyUrl.trim()) {
      setError("Please enter your Spotify Artist URL");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/artists/connect-spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotifyArtistUrl: spotifyUrl,
          walletAddress: formData.walletAddress,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to connect Spotify");
        return;
      }

      updateFormData({
        spotifyArtistId: data.data.artist.spotifyArtistId,
        spotifyProfile: data.data.profile,
        topTracks: data.data.topTracks,
        artistId: data.data.artist.id,
      });

      onNext();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sr-text-secondary">
        Connect your Spotify Artist account so we can verify your identity and fetch your music catalog.
      </p>

      <div>
        <label className="mb-2 block text-sm font-medium text-sr-text">
          Spotify Artist URL or ID
        </label>
        <input
          type="text"
          value={spotifyUrl}
          onChange={(e) => {
            setSpotifyUrl(e.target.value);
            setError("");
          }}
          placeholder="https://open.spotify.com/artist/..."
          className="input-sr w-full"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      {/* Show profile preview if already connected */}
      {formData.spotifyProfile && (
        <div className="flex items-center gap-4 rounded-lg bg-sr-mid/50 p-4">
          {formData.spotifyProfile.image && (
            <img
              src={formData.spotifyProfile.image}
              alt={formData.spotifyProfile.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-bold text-sr-text">{formData.spotifyProfile.name}</p>
            <p className="text-sm text-sr-text-secondary">
              {formData.spotifyProfile.followers?.toLocaleString()} followers
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {formData.spotifyProfile.genres.slice(0, 3).map((g) => (
                <span key={g} className="rounded-full bg-sr-green/20 px-2 py-0.5 text-xs text-sr-green">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-pill border border-sr-border text-sr-text-secondary hover:bg-sr-mid">
          ← Back
        </button>
        <button
          onClick={handleConnect}
          disabled={loading || !spotifyUrl.trim()}
          className="btn-pill bg-sr-green text-black hover:bg-sr-green/80 disabled:opacity-50"
        >
          {loading ? "Connecting..." : formData.spotifyProfile ? "Next →" : "Connect Spotify"}
        </button>
      </div>
    </div>
  );
}
