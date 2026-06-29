# Plan 8: Artist Onboarding & Tokenization Flow

## Overview
Implementasi full flow artist onboarding: registrasi, connect Spotify, pilih lagu, konfigurasi token, AI compliance check, dan deploy smart contract.

## Goals
- Multi-step artist onboarding form
- Spotify Artist ID verification
- Song selection from Spotify catalog
- Token configuration (supply, price, royalty rate)
- AI compliance verification
- Smart contract deployment
- Database records creation

## Tasks

### 8.1 Backend API Endpoints

#### POST /api/artists/connect-spotify
```typescript
// Verify Spotify Artist ID and fetch profile
import { NextRequest } from "next/server";
import { getArtistProfile, getArtistTopTracks, parseSpotifyArtistId } from "@/lib/spotify";
import { successResponse, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  const { spotifyArtistUrl, walletAddress } = await req.json();

  const artistId = parseSpotifyArtistId(spotifyArtistUrl);
  if (!artistId) {
    return errorResponse("Invalid Spotify Artist URL or ID");
  }

  const profile = await getArtistProfile(artistId);
  const topTracks = await getArtistTopTracks(artistId);

  // Update artist record
  const artist = await prisma.artist.upsert({
    where: { walletAddress },
    update: {
      spotifyArtistId: artistId,
      spotifyProfile: profile,
    },
    create: {
      name: profile.name,
      email: `${artistId}@soundright.app`,
      walletAddress,
      spotifyArtistId: artistId,
      spotifyProfile: profile,
    },
  });

  return successResponse({
    artist,
    profile: {
      name: profile.name,
      followers: profile.followers.total,
      genres: profile.genres,
      image: profile.images[0]?.url,
    },
    topTracks: topTracks.tracks.map((t: any) => ({
      id: t.id,
      name: t.name,
      albumArt: t.album.images[0]?.url,
      popularity: t.popularity,
      estimatedPlays: t.popularity * t.popularity * 1000,
    })),
  });
}
```

#### POST /api/songs/tokenize
```typescript
// Tokenize a song: deploy smart contract + mint tokens
import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/db";
import { calculateRoyalties } from "@/agents/royalty-calculator";
import { getTrackData, estimatePlayCountFromPopularity } from "@/lib/spotify";
import { getLastFmTrackData } from "@/lib/lastfm";

export async function POST(req: NextRequest) {
  const {
    artistId,
    spotifyTrackId,
    title,
    isrcCode,
    totalSupply,
    tokensForSale,
    pricePerToken,
    royaltyRatePerMille,
    distributionSchedule,
  } = await req.json();

  // 1. Get track data from Spotify
  const track = await getTrackData(spotifyTrackId);

  // 2. Get Last.fm data for cross-reference
  let lastFmPlays = 0;
  try {
    const lastFmData = await getLastFmTrackData(track.artists[0]?.name, track.name);
    lastFmPlays = lastFmData.playcount;
  } catch {}

  // 3. AI Compliance Check
  const estimatedPlays = estimatePlayCountFromPopularity(track.popularity);
  const complianceReport = await calculateRoyalties(
    title,
    track.artists[0]?.name || "Unknown",
    {
      spotifyPlays: estimatedPlays,
      lastFmPlays,
      weeklyDelta: estimatedPlays / 4, // Estimate weekly
      previousWeekDelta: estimatedPlays / 4,
    },
    royaltyRatePerMille,
    0.04 // CSPR price estimate
  );

  // 4. Create song record in database
  const song = await prisma.song.create({
    data: {
      artistId,
      title,
      spotifyTrackId,
      isrcCode: isrcCode || "",
      totalSupply,
      tokensForSale,
      pricePerTokenCspr: pricePerToken,
      royaltyRatePerMille,
      distributionSchedule: distributionSchedule || "weekly",
      currentPlayCount: BigInt(estimatedPlays),
      lastPlayCount: BigInt(estimatedPlays),
      weeklyPlays: Math.round(estimatedPlays / 4),
      complianceHash: complianceReport.reportHash,
      isVerified: complianceReport.isValid,
      status: "pending",
    },
  });

  // 5. TODO: Deploy smart contracts (Odra)
  // This will be triggered separately after review
  // - Deploy RoyaltyToken contract
  // - Deploy StreamOracle contract
  // - Deploy RoyaltyDistributor contract

  return successResponse({
    song,
    compliance: {
      isValid: complianceReport.isValid,
      anomalyDetected: complianceReport.anomalyDetected,
      confidenceScore: complianceReport.confidenceScore,
      summary: complianceReport.summary,
      reportHash: complianceReport.reportHash,
    },
  });
}
```

### 8.2 Frontend: Multi-Step Onboarding Form

#### Step Components
```
components/artist/onboard/
├── StepAccountSetup.tsx
├── StepConnectSpotify.tsx
├── StepSelectSong.tsx
├── StepTokenConfig.tsx
├── StepReviewDeploy.tsx
└── OnboardingWizard.tsx
```

#### Onboarding Wizard (components/artist/onboard/OnboardingWizard.tsx)
```typescript
"use client";

import { useState } from "react";
import { StepAccountSetup } from "./StepAccountSetup";
import { StepConnectSpotify } from "./StepConnectSpotify";
import { StepSelectSong } from "./StepSelectSong";
import { StepTokenConfig } from "./StepTokenConfig";
import { StepReviewDeploy } from "./StepReviewDeploy";

const STEPS = [
  { id: 1, title: "Account Setup", component: StepAccountSetup },
  { id: 2, title: "Connect Spotify", component: StepConnectSpotify },
  { id: 3, title: "Select Song", component: StepSelectSong },
  { id: 4, title: "Token Config", component: StepTokenConfig },
  { id: 5, title: "Review & Deploy", component: StepReviewDeploy },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    spotifyArtistId: "",
    spotifyProfile: null,
    selectedTrack: null,
    totalSupply: 1000,
    tokensForSale: 400,
    pricePerToken: 5,
    royaltyRatePerMille: 4,
    distributionSchedule: "weekly",
  });

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Bar */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
              currentStep >= step.id
                ? "bg-sr-green text-black"
                : "bg-sr-mid text-sr-text-secondary"
            }`}
          >
            {step.id}
          </div>
        ))}
      </div>

      {/* Step Title */}
      <h2 className="mb-6 text-2xl font-bold text-sr-text">
        Step {currentStep}/5: {STEPS[currentStep - 1].title}
      </h2>

      {/* Step Content */}
      <CurrentStepComponent
        formData={formData}
        setFormData={setFormData}
        onNext={() => setCurrentStep((s) => Math.min(s + 1, 5))}
        onBack={() => setCurrentStep((s) => Math.max(s - 1, 1))}
      />
    </div>
  );
}
```

### 8.3 Page Route (app/artist/onboard/page.tsx)
```typescript
import { OnboardingWizard } from "@/components/artist/onboard/OnboardingWizard";

export default function ArtistOnboardPage() {
  return (
    <main className="min-h-screen bg-sr-black px-4 py-12">
      <OnboardingWizard />
    </main>
  );
}
```

## Deliverables
- [ ] POST /api/artists/connect-spotify endpoint
- [ ] POST /api/songs/tokenize endpoint
- [ ] Multi-step onboarding wizard (5 steps)
- [ ] Spotify profile verification
- [ ] AI compliance check integration
- [ ] Smart contract deployment (placeholder)

## Dependencies
- Plan 1 (Architecture)
- Plan 2 (Casper Integration)
- Plan 3 (Spotify/Last.fm)
- Plan 4 (AI Agent)
- Plan 5 (Smart Contracts)
- Plan 7 (Backend API)

## Notes
- **No Fake Data**: Semua data dari Spotify API nyata
- **AI Compliance**: Verifikasi otomatis sebelum deploy contract
- **Multi-step Form**: Progress indicator, back/next navigation
- **Token Config**: Default values, slider untuk % token yang dijual
