"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { StepAccountSetup } from "./StepAccountSetup";
import { StepConnectSpotify } from "./StepConnectSpotify";
import { StepSelectSong } from "./StepSelectSong";
import { StepTokenConfig } from "./StepTokenConfig";
import { StepReviewDeploy } from "./StepReviewDeploy";

export interface OnboardingData {
  name: string;
  email: string;
  country: string;
  walletAddress: string;
  spotifyArtistId: string;
  spotifyProfile: {
    name: string;
    followers: number;
    genres: string[];
    image: string | null;
  } | null;
  topTracks: Array<{
    id: string;
    name: string;
    albumArt: string | null;
    popularity: number;
    estimatedPlays: number;
  }>;
  selectedTrack: {
    id: string;
    name: string;
    albumArt: string | null;
  } | null;
  title: string;
  isrcCode: string;
  totalSupply: number;
  tokensForSale: number;
  pricePerToken: number;
  royaltyRatePerMille: number;
  distributionSchedule: "weekly" | "monthly";
  artistId: string | null;
  songId: string | null;
}

const INITIAL_DATA: OnboardingData = {
  name: "",
  email: "",
  country: "",
  walletAddress: "",
  spotifyArtistId: "",
  spotifyProfile: null,
  topTracks: [],
  selectedTrack: null,
  title: "",
  isrcCode: "",
  totalSupply: 10000,
  tokensForSale: 4000,
  pricePerToken: 5,
  royaltyRatePerMille: 4,
  distributionSchedule: "weekly",
  artistId: null,
  songId: null,
};

const STEPS = [
  { id: 1, title: "Account Setup" },
  { id: 2, title: "Connect Spotify" },
  { id: 3, title: "Select Song" },
  { id: 4, title: "Token Config" },
  { id: 5, title: "Review & Deploy" },
];

const STEP_COMPONENTS = [
  StepAccountSetup,
  StepConnectSpotify,
  StepSelectSong,
  StepTokenConfig,
  StepReviewDeploy,
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(INITIAL_DATA);
  const { address, isConnected } = useWallet();

  // Auto-populate walletAddress from connected wallet
  useEffect(() => {
    if (isConnected && address) {
      setFormData((prev) => ({ ...prev, walletAddress: address }));
    }
  }, [isConnected, address]);

  const CurrentStepComponent = STEP_COMPONENTS[currentStep - 1];

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    currentStep > step.id
                      ? "bg-sr-green text-black"
                      : currentStep === step.id
                        ? "bg-sr-green text-black ring-2 ring-sr-green/50 ring-offset-2 ring-offset-sr-black"
                        : "bg-sr-mid text-sr-text-secondary"
                  }`}
                >
                  {currentStep > step.id ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span className="mt-2 text-xs text-sr-text-secondary">{step.title}</span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="mx-2 mb-6 h-0.5 w-8 sm:w-12">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > step.id ? "bg-sr-green" : "bg-sr-mid"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Title */}
      <h2 className="mb-6 text-2xl font-bold text-sr-text">
        {STEPS[currentStep - 1].title}
      </h2>

      {/* Step Content */}
      <div className="rounded-xl bg-sr-card p-6">
        <CurrentStepComponent
          formData={formData}
          updateFormData={updateFormData}
          onNext={() => setCurrentStep((s) => Math.min(s + 1, 5))}
          onBack={() => setCurrentStep((s) => Math.max(s - 1, 1))}
        />
      </div>
    </div>
  );
}
