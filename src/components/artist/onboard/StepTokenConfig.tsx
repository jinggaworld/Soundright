"use client";

import type { OnboardingData } from "./OnboardingWizard";

interface StepProps {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTokenConfig({ formData, updateFormData, onNext, onBack }: StepProps) {
  const salePercentage = Math.round((formData.tokensForSale / formData.totalSupply) * 100);
  const artistRevenue = formData.tokensForSale * formData.pricePerToken;

  return (
    <div className="space-y-6">
      <p className="text-sr-text-secondary">
        Configure how your song tokens will be structured.
      </p>

      {/* Total Supply */}
      <div>
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-sr-text">
          <span>Total Token Supply</span>
          <span className="text-sr-green">{formData.totalSupply.toLocaleString()}</span>
        </label>
        <input
          type="range"
          min={1000}
          max={100000}
          step={1000}
          value={formData.totalSupply}
          onChange={(e) => {
            const total = parseInt(e.target.value);
            updateFormData({
              totalSupply: total,
              tokensForSale: Math.min(formData.tokensForSale, total),
            });
          }}
          className="w-full accent-sr-green"
        />
        <div className="flex justify-between text-xs text-sr-text-secondary">
          <span>1,000</span>
          <span>100,000</span>
        </div>
      </div>

      {/* Tokens for Sale */}
      <div>
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-sr-text">
          <span>Tokens for Sale</span>
          <span className="text-sr-green">
            {formData.tokensForSale.toLocaleString()} ({salePercentage}%)
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={formData.totalSupply}
          step={100}
          value={formData.tokensForSale}
          onChange={(e) => updateFormData({ tokensForSale: parseInt(e.target.value) })}
          className="w-full accent-sr-green"
        />
        <div className="flex justify-between text-xs text-sr-text-secondary">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Price per Token */}
      <div>
        <label className="mb-2 block text-sm font-medium text-sr-text">
          Price per Token (CSPR)
        </label>
        <input
          type="number"
          min={0.1}
          step={0.5}
          value={formData.pricePerToken}
          onChange={(e) => updateFormData({ pricePerToken: parseFloat(e.target.value) || 0 })}
          className="input-sr w-full"
        />
        <p className="mt-1 text-xs text-sr-text-secondary">
          Estimated revenue: <span className="text-sr-green">{artistRevenue.toLocaleString()} CSPR</span>
        </p>
      </div>

      {/* Royalty Rate */}
      <div>
        <label className="mb-2 flex items-center justify-between text-sm font-medium text-sr-text">
          <span>Royalty Rate (per mille)</span>
          <span className="text-sr-green">{(formData.royaltyRatePerMille / 10).toFixed(1)}%</span>
        </label>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={formData.royaltyRatePerMille}
          onChange={(e) => updateFormData({ royaltyRatePerMille: parseInt(e.target.value) })}
          className="w-full accent-sr-green"
        />
        <div className="flex justify-between text-xs text-sr-text-secondary">
          <span>0.1%</span>
          <span>5.0%</span>
        </div>
      </div>

      {/* Distribution Schedule */}
      <div>
        <label className="mb-2 block text-sm font-medium text-sr-text">
          Distribution Schedule
        </label>
        <div className="flex gap-3">
          {(["weekly", "monthly"] as const).map((schedule) => (
            <button
              key={schedule}
              onClick={() => updateFormData({ distributionSchedule: schedule })}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                formData.distributionSchedule === schedule
                  ? "bg-sr-green text-black"
                  : "bg-sr-mid text-sr-text-secondary hover:bg-sr-mid/80"
              }`}
            >
              {schedule.charAt(0).toUpperCase() + schedule.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn-pill border border-sr-border text-sr-text-secondary hover:bg-sr-mid">
          ← Back
        </button>
        <button onClick={onNext} className="btn-pill bg-sr-green text-black hover:bg-sr-green/80">
          Next →
        </button>
      </div>
    </div>
  );
}
