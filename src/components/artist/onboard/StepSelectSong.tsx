"use client";

import { useState } from "react";
import type { OnboardingData } from "./OnboardingWizard";

interface StepProps {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSelectSong({ formData, updateFormData, onNext, onBack }: StepProps) {
  const [customTitle, setCustomTitle] = useState(formData.title || "");

  const handleSelectTrack = (track: OnboardingData["topTracks"][number]) => {
    updateFormData({
      selectedTrack: { id: track.id, name: track.name, albumArt: track.albumArt },
      title: track.name,
    });
    setCustomTitle(track.name);
  };

  const canProceed = formData.selectedTrack && customTitle.trim();

  return (
    <div className="space-y-6">
      <p className="text-sr-text-secondary">
        Choose a song from your Spotify catalog to tokenize.
      </p>

      {/* Track list */}
      {formData.topTracks.length > 0 ? (
        <div className="space-y-2">
          {formData.topTracks.map((track) => (
            <button
              key={track.id}
              onClick={() => handleSelectTrack(track)}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all ${
                formData.selectedTrack?.id === track.id
                  ? "bg-sr-green/20 ring-1 ring-sr-green"
                  : "bg-sr-mid/50 hover:bg-sr-mid"
              }`}
            >
              {track.albumArt && (
                <img src={track.albumArt} alt="" className="h-12 w-12 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sr-text">{track.name}</p>
                <p className="text-xs text-sr-text-secondary">
                  ~{track.estimatedPlays.toLocaleString()} est. plays
                </p>
              </div>
              {formData.selectedTrack?.id === track.id && (
                <span className="text-sr-green">✓</span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-sr-mid/50 p-8 text-center text-sr-text-secondary">
          <p>No tracks found. Make sure your Spotify account has published music.</p>
        </div>
      )}

      {/* Custom title override */}
      {formData.selectedTrack && (
        <div>
          <label className="mb-2 block text-sm font-medium text-sr-text">
            Song Title (edit if needed)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => {
              setCustomTitle(e.target.value);
              updateFormData({ title: e.target.value });
            }}
            className="input-sr w-full"
          />
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-pill border border-sr-border text-sr-text-secondary hover:bg-sr-mid">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-pill bg-sr-green text-black hover:bg-sr-green/80 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
