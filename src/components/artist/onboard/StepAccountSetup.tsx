"use client";

import type { OnboardingData } from "./OnboardingWizard";

interface StepProps {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAccountSetup({ formData, updateFormData, onNext }: StepProps) {
  const canProceed = formData.name.trim() && formData.email.trim();

  return (
    <div className="space-y-6">
      <p className="text-sr-text-secondary">
        Set up your artist profile. This information will be displayed to investors.
      </p>

      <div>
        <label className="mb-2 block text-sm font-medium text-sr-text">
          Artist / Band Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          placeholder="e.g. Midnight Drive"
          className="input-sr w-full"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-sr-text">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          placeholder="artist@example.com"
          className="input-sr w-full"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-sr-text">
          Country
        </label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => updateFormData({ country: e.target.value })}
          placeholder="e.g. Indonesia"
          className="input-sr w-full"
        />
      </div>

      <div className="flex justify-end pt-4">
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
