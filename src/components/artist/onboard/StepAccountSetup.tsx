"use client";

import type { OnboardingData } from "./OnboardingWizard";
import { useWallet } from "@/components/wallet/WalletProvider";

interface StepProps {
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepAccountSetup({ formData, updateFormData, onNext }: StepProps) {
  const { isConnected, address, balance, connect, isConnecting } = useWallet();
  const canProceed = formData.name.trim() && formData.email.trim() && isConnected;

  return (
    <div className="space-y-6">
      <p className="text-sr-text-secondary">
        Set up your artist profile. This information will be displayed to investors.
      </p>

      {/* Wallet Connection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-sr-text">
          Connect Your Wallet
        </label>
        {isConnected && address ? (
          <div className="rounded-lg bg-sr-mid/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sr-green"></span>
                <span className="text-sm text-sr-text font-mono">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </span>
              </div>
              {balance !== null && (
                <span className="text-xs text-sr-text-secondary">
                  {balance.toFixed(2)} CSPR
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full rounded-lg border border-sr-border bg-sr-mid/30 p-3 text-left text-sm text-sr-text-secondary hover:border-sr-green/50 hover:bg-sr-mid/50 transition-colors"
          >
            {isConnecting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-sr-green border-t-transparent"></span>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Click to connect Casper Wallet
              </span>
            )}
          </button>
        )}
        {!isConnected && (
          <p className="mt-2 text-xs text-sr-text-secondary">
            Required to receive royalty payments and tokenize your music.
          </p>
        )}
      </div>

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
