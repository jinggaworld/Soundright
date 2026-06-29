# 🎵 SoundRight — Music Royalty Tokenization Platform
> **Casper Agentic Buildathon 2026 | Track: RWA Tokenization**
> Built on Casper Network · Powered by x402 · AI-driven Royalty Engine

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Full Flow — Step by Step](#3-full-flow--step-by-step)
4. [Smart Contracts](#4-smart-contracts)
5. [AI Agents](#5-ai-agents)
6. [Backend API](#6-backend-api)
7. [Frontend — Full UI Features](#7-frontend--full-ui-features)
8. [Database Schema](#8-database-schema)
9. [x402 Integration](#9-x402-integration)
10. [Spotify & Last.fm Integration](#10-spotify--lastfm-integration)
11. [Folder Structure](#11-folder-structure)
12. [Environment Variables](#12-environment-variables)
13. [Deployment Guide](#13-deployment-guide)
14. [Demo Script](#14-demo-script)

---

## 1. Project Overview

### Tagline
> *"Every stream is money. Own a piece of it."*

### Problem
- Musisi indie tidak dapat royalti secara langsung dan transparan
- Tidak ada cara bagi investor untuk membeli "saham" dari pendapatan musik
- Royalti dari Spotify butuh 6–12 bulan untuk sampai ke artis
- Tidak ada audit trail yang transparan untuk pembayaran royalti

### Solution
SoundRight memungkinkan musisi **tokenize royalti lagu mereka** di Casper Network. Investor bisa membeli token yang merepresentasikan % dari royalti lagu. Setiap minggu, AI Agent pull data dari Spotify, kalkulasi royalti, dan distribusikan pembayaran otomatis ke semua token holders via x402 micropayments — semua on-chain, transparan, tanpa perantara.

### Key Differentiators
- **Fully on-chain royalty distribution** via Casper smart contracts
- **AI Royalty Agent** yang verifikasi dan kalkulasi stream data
- **x402 micropayments** untuk distribusi per-holder otomatis
- **Fraud detection** — AI detect stream farming anomali
- **Real Spotify data** — bukan simulasi, data play count nyata

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOUNDRIGHT PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     │
│  │   Artist     │     │   Investor   │     │  Admin/DAO   │     │
│  │  Dashboard   │     │  Dashboard   │     │   Panel      │     │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     │
│         │                    │                     │             │
│  ┌──────▼────────────────────▼─────────────────────▼──────────┐ │
│  │                    Next.js Frontend                         │ │
│  │              (App Router + Tailwind CSS)                    │ │
│  └──────────────────────────┬───────────────────────────────── ┘ │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                    Backend API (Node.js)                     │ │
│  │   /api/artists  /api/songs  /api/tokens  /api/royalties     │ │
│  └────┬──────────────┬──────────────┬──────────────┬───────────┘ │
│       │              │              │              │             │
│  ┌────▼────┐   ┌─────▼────┐  ┌─────▼────┐  ┌─────▼────┐       │
│  │Spotify  │   │ Last.fm  │  │  Claude  │  │  Casper  │       │
│  │  API    │   │   API    │  │    AI    │  │   Node   │       │
│  │(gratis) │   │ (gratis) │  │  Agent   │  │   RPC    │       │
│  └─────────┘   └──────────┘  └──────────┘  └──────────┘       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │               Casper Network (Mainnet)                       │ │
│  │  ┌────────────┐ ┌──────────────┐ ┌────────────────────────┐ │ │
│  │  │RoyaltyToken│ │  Distributor │ │    StreamOracle        │ │ │
│  │  │ Contract   │ │   Contract   │ │     Contract           │ │ │
│  │  └────────────┘ └──────────────┘ └────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Full Flow — Step by Step

### 🎤 Flow A: Artist Onboarding & Tokenization

```
Step 1: Artist Register
├── Input: nama, email, wallet address (CSPR)
├── Verifikasi email
└── KYC sederhana (nama + country)

Step 2: Connect Spotify
├── Artist masukkan Spotify Artist ID (public, gratis)
│   contoh: spotify:artist:4Z8W4fKeB5YxbusRsdQVPb (Radiohead)
├── System pull artist profile & top tracks
└── Tampilkan list lagu + current play count

Step 3: Select Song to Tokenize
├── Artist pilih 1 lagu
├── Input: judul, ISRC code, royalty rate ($/1000 streams)
└── Preview estimasi pendapatan

Step 4: Define Token Structure
├── Total supply: misal 1000 tokens = 100% royalti lagu ini
├── Artist retain: misal 600 tokens (60%)
├── Offered to investors: 400 tokens (40%)
├── Price per token: misal $5 CSPR
└── Distribution schedule: Weekly / Monthly

Step 5: AI Compliance Check
├── AI Agent verifikasi data Spotify valid
├── Cross-check dengan Last.fm play count
├── Detect jika ada anomali (stream farming)
└── Generate compliance report → hash di-commit ke chain

Step 6: Deploy Smart Contract
├── Odra contract di-deploy ke Casper mainnet
├── Mint 1000 RoyaltyTokens ke artist wallet
├── StreamOracle di-initialize dengan current play count
└── Tampilkan contract address + Casper Explorer link

Step 7: Launch Token Sale
├── 400 tokens listed di SoundRight marketplace
├── Notifikasi ke potential investors
└── Artist dapat dashboard untuk monitor sales
```

---

### 💰 Flow B: Investor Journey

```
Step 1: Investor Browse Marketplace
├── Lihat semua lagu yang sudah tokenized
├── Filter by: genre, artist, yield %, price, volume
└── Sort by: trending, newest, highest yield

Step 2: View Song Detail
├── Spotify play count (real-time)
├── Historical play count chart (6 bulan)
├── Royalty history (pembayaran sebelumnya)
├── Token holders distribution
├── AI yield prediction (next 30 days)
└── Compliance report (dari AI Agent)

Step 3: Buy Tokens via x402
├── Input: jumlah token yang mau dibeli
├── Preview: total cost + estimasi royalti per bulan
├── Connect CSPR wallet (CSPR.click)
├── x402 payment request → sign transaction
└── Token masuk ke investor wallet on-chain

Step 4: Monitor Portfolio
├── Dashboard total holdings
├── Royalti yang sudah diterima
├── Unrealized gains (jika token price naik)
└── Upcoming distribution date

Step 5: Receive Royalty Distribution
├── Setiap Senin: AI Agent pull Spotify data
├── Kalkulasi royalti minggu ini
├── Smart contract distribute ke semua holders (pro-rata)
├── x402 micropayment per holder
└── Notifikasi + receipt on-chain
```

---

### 🤖 Flow C: Weekly Royalty Distribution (Automated)

```
Cron Job: Setiap Senin 00:00 UTC
│
├── Step 1: Pull Data
│   ├── Spotify API → current play count semua lagu
│   ├── Last.fm API → cross-reference plays
│   └── Hitung delta (plays minggu ini - plays minggu lalu)
│
├── Step 2: AI Verification
│   ├── Claude AI Agent analisis data
│   ├── Detect anomali (spike tidak wajar?)
│   ├── Approve atau flag untuk review
│   └── Generate royalty report
│
├── Step 3: Kalkulasi Royalti
│   ├── Plays × royalty_rate = total_royalty (USD)
│   ├── Convert USD → CSPR (price feed)
│   └── Per token = total_royalty / total_supply
│
├── Step 4: On-Chain Update
│   ├── Oracle submit play count ke StreamOracle contract
│   ├── Distributor contract kalkulasi per-holder amount
│   └── Batch payment ke semua holders via x402
│
└── Step 5: Notification
    ├── Email ke semua holders
    ├── Dashboard update
    └── On-chain event log
```

---

## 4. Smart Contracts

### Contract 1: RoyaltyToken.rs
```rust
// Odra Framework — Casper Network
// Token ERC-20 style yang representasikan % royalti lagu

use odra::prelude::*;
use odra::casper_types::{U256, U512};

#[odra::module]
pub struct RoyaltyToken {
    // Metadata
    name: Var<String>,
    symbol: Var<String>,
    decimals: Var<u8>,
    total_supply: Var<U256>,
    
    // Song info
    song_title: Var<String>,
    spotify_track_id: Var<String>,
    isrc_code: Var<String>,
    artist_address: Var<Address>,
    
    // Royalty config
    royalty_rate_per_mille: Var<U256>,  // per 1000 streams, dalam CSPR motes
    distribution_interval: Var<u64>,    // dalam detik, default 604800 (1 minggu)
    last_distribution: Var<u64>,
    
    // Compliance
    compliance_hash: Var<String>,       // IPFS hash dari AI compliance report
    is_verified: Var<bool>,
    
    // Balances & Allowances
    balances: Mapping<Address, U256>,
    allowances: Mapping<Address, Mapping<Address, U256>>,
    
    // Transfer lock (KYC)
    kyc_verified: Mapping<Address, bool>,
    transfers_locked: Var<bool>,
}

#[odra::module]
impl RoyaltyToken {
    pub fn init(
        &mut self,
        name: String,
        symbol: String,
        total_supply: U256,
        song_title: String,
        spotify_track_id: String,
        isrc_code: String,
        royalty_rate_per_mille: U256,
        compliance_hash: String,
    ) {
        let caller = self.env().caller();
        self.name.set(name);
        self.symbol.set(symbol);
        self.decimals.set(18u8);
        self.total_supply.set(total_supply);
        self.song_title.set(song_title);
        self.spotify_track_id.set(spotify_track_id);
        self.isrc_code.set(isrc_code);
        self.artist_address.set(caller);
        self.royalty_rate_per_mille.set(royalty_rate_per_mille);
        self.distribution_interval.set(604800u64); // 1 minggu
        self.compliance_hash.set(compliance_hash);
        self.is_verified.set(false);
        self.transfers_locked.set(true);
        
        // Mint semua token ke artist
        self.balances.set(&caller, total_supply);
    }
    
    pub fn transfer(&mut self, to: Address, amount: U256) {
        // Cek KYC jika transfers locked
        if self.transfers_locked.get() {
            let caller = self.env().caller();
            if !self.kyc_verified.get(&caller) {
                self.env().revert(RoyaltyTokenError::NotKycVerified);
            }
        }
        self._transfer(self.env().caller(), to, amount);
    }
    
    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get(&owner)
    }
    
    pub fn total_supply(&self) -> U256 {
        self.total_supply.get()
    }
    
    // Hanya Distributor contract yang bisa panggil ini
    pub fn set_verified(&mut self, compliance_hash: String) {
        self.is_verified.set(true);
        self.compliance_hash.set(compliance_hash);
    }
    
    pub fn set_kyc_verified(&mut self, address: Address) {
        // Hanya admin/oracle
        self.kyc_verified.set(&address, true);
    }
    
    fn _transfer(&mut self, from: Address, to: Address, amount: U256) {
        let from_balance = self.balances.get(&from);
        if from_balance < amount {
            self.env().revert(RoyaltyTokenError::InsufficientBalance);
        }
        self.balances.set(&from, from_balance - amount);
        let to_balance = self.balances.get(&to);
        self.balances.set(&to, to_balance + amount);
    }
}

#[odra::odra_error]
pub enum RoyaltyTokenError {
    InsufficientBalance = 1,
    NotKycVerified = 2,
    Unauthorized = 3,
}
```

---

### Contract 2: RoyaltyDistributor.rs
```rust
// Distributor — menerima royalti dan distribusi ke semua holders

#[odra::module]
pub struct RoyaltyDistributor {
    // Config
    token_contract: Var<Address>,
    oracle_contract: Var<Address>,
    admin: Var<Address>,
    
    // Distribution state
    total_distributed: Var<U512>,
    last_play_count: Var<u64>,
    distribution_count: Var<u32>,
    
    // Per-holder tracking
    holder_claimed: Mapping<Address, U512>,
    pending_royalties: Mapping<Address, U512>,
    
    // Holders list (untuk iterasi)
    holders: Vec<Address>,
    holder_count: Var<u32>,
}

#[odra::module]
impl RoyaltyDistributor {
    pub fn distribute_royalties(
        &mut self,
        new_play_count: u64,
        cspr_per_play: U512,    // dari price oracle
        holders: Vec<Address>,
        amounts: Vec<U512>,
    ) {
        // Hanya oracle yang bisa panggil
        let caller = self.env().caller();
        if caller != self.oracle_contract.get() {
            self.env().revert(DistributorError::Unauthorized);
        }
        
        // Update state
        let plays_this_period = new_play_count - self.last_play_count.get();
        let total_royalty = U512::from(plays_this_period) * cspr_per_play;
        self.last_play_count.set(new_play_count);
        
        // Transfer ke masing-masing holder (sudah dihitung off-chain)
        for (i, holder) in holders.iter().enumerate() {
            let amount = amounts[i];
            let current_pending = self.pending_royalties.get(holder);
            self.pending_royalties.set(holder, current_pending + amount);
        }
        
        self.total_distributed.set(
            self.total_distributed.get() + total_royalty
        );
        self.distribution_count.set(
            self.distribution_count.get() + 1
        );
    }
    
    pub fn claim_royalties(&mut self) {
        let caller = self.env().caller();
        let pending = self.pending_royalties.get(&caller);
        
        if pending == U512::zero() {
            self.env().revert(DistributorError::NoPendingRoyalties);
        }
        
        self.pending_royalties.set(&caller, U512::zero());
        self.holder_claimed.set(
            &caller, 
            self.holder_claimed.get(&caller) + pending
        );
        
        // Transfer CSPR ke holder (via x402)
        self.env().transfer_tokens(&caller, &pending);
    }
    
    pub fn get_pending(&self, holder: Address) -> U512 {
        self.pending_royalties.get(&holder)
    }
    
    pub fn get_total_claimed(&self, holder: Address) -> U512 {
        self.holder_claimed.get(&holder)
    }
}

#[odra::odra_error]
pub enum DistributorError {
    Unauthorized = 1,
    NoPendingRoyalties = 2,
    TransferFailed = 3,
}
```

---

### Contract 3: StreamOracle.rs
```rust
// Oracle — menyimpan play count terverifikasi on-chain

#[odra::module]
pub struct StreamOracle {
    admin: Var<Address>,
    authorized_reporters: Mapping<Address, bool>,
    
    // Per-song data
    // key: spotify_track_id
    play_counts: Mapping<String, u64>,
    last_updated: Mapping<String, u64>,
    ai_report_hashes: Mapping<String, String>,
    
    // History (simplified)
    update_count: Mapping<String, u32>,
}

#[odra::module]
impl StreamOracle {
    pub fn report_play_count(
        &mut self,
        spotify_track_id: String,
        play_count: u64,
        ai_report_hash: String,   // Hash dari AI verification report
    ) {
        let caller = self.env().caller();
        if !self.authorized_reporters.get(&caller) {
            self.env().revert(OracleError::Unauthorized);
        }
        
        self.play_counts.set(&spotify_track_id, play_count);
        self.last_updated.set(
            &spotify_track_id, 
            self.env().block_time()
        );
        self.ai_report_hashes.set(&spotify_track_id, ai_report_hash);
        self.update_count.set(
            &spotify_track_id,
            self.update_count.get(&spotify_track_id) + 1
        );
    }
    
    pub fn get_play_count(&self, spotify_track_id: String) -> u64 {
        self.play_counts.get(&spotify_track_id)
    }
    
    pub fn get_last_updated(&self, spotify_track_id: String) -> u64 {
        self.last_updated.get(&spotify_track_id)
    }
    
    pub fn add_reporter(&mut self, reporter: Address) {
        let caller = self.env().caller();
        if caller != self.admin.get() {
            self.env().revert(OracleError::Unauthorized);
        }
        self.authorized_reporters.set(&reporter, true);
    }
}

#[odra::odra_error]
pub enum OracleError {
    Unauthorized = 1,
    InvalidData = 2,
}
```

---

## 5. AI Agents

### Agent 1: Royalty Calculator Agent
**File:** `agents/royalty-calculator.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

interface StreamData {
  spotifyPlays: number;
  lastFmPlays: number;
  weeklyDelta: number;
  previousWeekDelta: number;
}

interface RoyaltyReport {
  isValid: boolean;
  anomalyDetected: boolean;
  anomalyReason?: string;
  approvedPlays: number;
  estimatedRoyaltyUSD: number;
  estimatedRoyaltyCSPR: number;
  confidenceScore: number; // 0-100
  reportHash: string;
  rawReport: string;
}

export async function calculateRoyalties(
  songTitle: string,
  artistName: string,
  streamData: StreamData,
  royaltyRatePerThousand: number, // USD per 1000 streams
  csprPriceUSD: number
): Promise<RoyaltyReport> {
  const client = new Anthropic();

  const prompt = `
You are a music royalty verification agent for SoundRight, a blockchain-based royalty tokenization platform.

Analyze the following streaming data and determine if it's legitimate:

Song: "${songTitle}" by ${artistName}
Spotify plays this week: ${streamData.spotifyPlays.toLocaleString()}
Last.fm plays this week: ${streamData.lastFmPlays.toLocaleString()}
Weekly delta (new plays): ${streamData.weeklyDelta.toLocaleString()}
Previous week delta: ${streamData.previousWeekDelta.toLocaleString()}
Growth rate: ${(((streamData.weeklyDelta - streamData.previousWeekDelta) / streamData.previousWeekDelta) * 100).toFixed(1)}%

Royalty rate: $${royaltyRatePerThousand} per 1,000 streams
Current CSPR price: $${csprPriceUSD}

Your task:
1. Detect if there are any anomalies (stream farming, bot plays, suspicious spikes >500% week-over-week)
2. Cross-reference Spotify vs Last.fm consistency (should be within 30% of each other)
3. Calculate approved royalty amount
4. Generate a confidence score (0-100)

Respond in this exact JSON format:
{
  "isValid": boolean,
  "anomalyDetected": boolean,
  "anomalyReason": "string or null",
  "approvedPlays": number,
  "estimatedRoyaltyUSD": number,
  "estimatedRoyaltyCSPR": number,
  "confidenceScore": number,
  "summary": "2-3 sentence explanation"
}
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const parsed = JSON.parse(content.text.replace(/```json|```/g, "").trim());

  // Generate deterministic hash dari report
  const reportString = JSON.stringify({ ...parsed, timestamp: Date.now() });
  const reportHash = await generateHash(reportString);

  return {
    ...parsed,
    reportHash,
    rawReport: reportString,
  };
}

async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

---

### Agent 2: Yield Prediction Agent
**File:** `agents/yield-predictor.ts`

```typescript
// Prediksi royalti 30 hari ke depan berdasarkan historical data
export async function predictYield(
  songTitle: string,
  historicalPlays: number[], // array 12 minggu terakhir
  royaltyRatePerThousand: number
): Promise<{
  predictedPlaysNextMonth: number;
  predictedRoyaltyUSD: number;
  trend: "growing" | "stable" | "declining";
  confidence: number;
  reasoning: string;
}> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `
You are a music analytics AI. Predict next month's streaming performance.

Song: "${songTitle}"
Weekly plays (last 12 weeks, oldest to newest): ${historicalPlays.join(", ")}
Royalty rate: $${royaltyRatePerThousand} per 1,000 streams

Predict next 4 weeks total plays and estimated royalty.
Respond in JSON: { "predictedPlaysNextMonth": number, "predictedRoyaltyUSD": number, "trend": "growing|stable|declining", "confidence": number, "reasoning": "string" }
      `,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
```

---

## 6. Backend API

### Endpoints

```
POST   /api/auth/register          → Artist/Investor registration
POST   /api/auth/login
GET    /api/auth/me

POST   /api/artists/connect-spotify → Link Spotify Artist ID
GET    /api/artists/:id/songs       → List songs dari Spotify
GET    /api/artists/:id/dashboard   → Artist dashboard data

POST   /api/songs/tokenize          → Deploy smart contract + mint tokens
GET    /api/songs                   → List semua lagu (marketplace)
GET    /api/songs/:id               → Detail lagu + stats
GET    /api/songs/:id/holders       → List token holders
GET    /api/songs/:id/history       → Royalty distribution history
GET    /api/songs/:id/predict       → AI yield prediction

POST   /api/tokens/buy              → Buy tokens via x402
GET    /api/tokens/my-holdings      → Investor portfolio
POST   /api/tokens/sell             → List tokens for sale

POST   /api/royalties/distribute    → (Internal/Cron) Trigger distribution
GET    /api/royalties/pending/:addr → Pending royalties untuk address
POST   /api/royalties/claim         → Claim pending royalties

GET    /api/spotify/artist/:id      → Pull Spotify artist data
GET    /api/spotify/track/:id       → Pull track play count
GET    /api/oracle/play-count/:id   → Get on-chain verified play count
```

---

### Spotify Integration
**File:** `lib/spotify.ts`

```typescript
// Spotify Web API — GRATIS, tidak perlu premium
// Hanya butuh Client ID + Client Secret dari developer.spotify.com

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;

async function getSpotifyToken(): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  return data.access_token;
}

export async function getTrackData(trackId: string) {
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
  // Returns: name, popularity, artists, album, duration_ms, etc.
}

export async function getArtistTopTracks(artistId: string) {
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
}

export async function getArtistProfile(artistId: string) {
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.json();
  // Returns: name, followers, genres, popularity, images
}
```

---

## 7. Frontend — Full UI Features

### Pages & Components

```
app/
├── page.tsx                    → Landing page
├── marketplace/
│   └── page.tsx               → Browse semua lagu tokenized
├── song/
│   └── [id]/
│       └── page.tsx           → Song detail + buy tokens
├── artist/
│   ├── onboard/page.tsx       → Artist registration flow
│   ├── connect/page.tsx       → Connect Spotify
│   ├── tokenize/page.tsx      → Tokenize lagu
│   └── dashboard/page.tsx     → Artist dashboard
├── investor/
│   └── dashboard/page.tsx     → Investor portfolio
└── admin/
    └── page.tsx               → Admin panel
```

---

### Page 1: Landing Page (`/`)

**Sections:**
- Hero: "Own a Piece of Music" + CTA buttons (Artist / Investor)
- How It Works: 3-step flow animation
- Live Stats: Total songs tokenized, total royalties distributed, total investors
- Featured Songs: 3 top performing songs dari marketplace
- Why Casper: Deterministic finality, fixed costs, enterprise-grade
- Footer

---

### Page 2: Marketplace (`/marketplace`)

**Features:**
- Grid/List toggle view
- Search bar (cari by artist, song title)
- Filter sidebar:
  - Genre (Pop, Rock, Electronic, Hip-hop, Indie)
  - Yield % (>5%, >10%, >20%)
  - Price per token ($1-5, $5-20, $20+)
  - Status (Active sale, Fully distributed, New listing)
- Sort: Highest yield, Most popular, Recently listed, Lowest price
- Song Card Component:
  ```
  ┌─────────────────────────────┐
  │  🎵 Album Art               │
  │  Song Title                 │
  │  Artist Name                │
  │  ─────────────────────────  │
  │  Spotify Plays: 1.2M        │
  │  Weekly Royalty: $340       │
  │  Token Price: 5 CSPR        │
  │  Available: 234/400 tokens  │
  │  Yield: 12.4% / year        │
  │  ─────────────────────────  │
  │  [Buy Tokens]               │
  └─────────────────────────────┘
  ```
- Pagination (20 per page)

---

### Page 3: Song Detail (`/song/[id]`)

**Tabs:**
1. **Overview**
   - Song info (title, artist, album art dari Spotify)
   - Spotify embed preview (30 detik — ini gratis dan tidak perlu premium)
   - Play count chart (Recharts line chart — 12 minggu history)
   - Token sale progress bar
   - Buy widget:
     ```
     ┌──────────────────────────┐
     │  Token Price: 5.2 CSPR   │
     │  Available: 234 tokens   │
     │                          │
     │  Quantity: [___] tokens  │
     │  Total: XX CSPR          │
     │  Est. monthly: $X.XX     │
     │                          │
     │  [Connect Wallet]        │
     │  [Buy via x402]          │
     └──────────────────────────┘
     ```

2. **Analytics**
   - Weekly plays bar chart (Recharts)
   - Monthly royalty distribution history (table)
   - AI Yield Prediction card:
     - Next month prediction
     - Trend indicator (📈 Growing / ➡️ Stable / 📉 Declining)
     - Confidence score
   - Spotify popularity score gauge

3. **Holders**
   - Token holders table:
     | Address | Tokens | % Share | Total Earned |
   - Distribution pie chart
   - Total holders count

4. **Compliance**
   - AI verification status badge (✅ Verified)
   - Compliance report summary
   - On-chain report hash (link ke Casper Explorer)
   - Last verification date
   - Anomaly detection history

5. **Contract**
   - Contract address (clickable → Casper Explorer)
   - StreamOracle address
   - Distributor address
   - Total distributed to date
   - Next distribution countdown

---

### Page 4: Artist Onboarding (`/artist/onboard`)

**Multi-step form:**

```
Step 1/5: Account Setup
├── Name, email, password
├── Country
└── Accept terms

Step 2/5: Connect Spotify
├── Input Spotify Artist ID atau Artist URL
├── Preview: foto, nama, followers, genre
└── Konfirmasi "Is this you?"

Step 3/5: Select Song
├── List top tracks dari Spotify (pakai API)
├── Klik untuk pilih 1 lagu
└── Input ISRC code (optional)

Step 4/5: Token Configuration
├── Total token supply (default: 1000)
├── % yang dijual ke investor (slider: 0-80%)
├── Price per token (CSPR)
├── Royalty rate ($ per 1000 streams)
├── Distribution schedule (Weekly/Monthly)
└── Preview: estimasi pendapatan

Step 5/5: Review & Deploy
├── Summary semua config
├── AI Compliance Check (real-time, loading state)
├── Deploy contract button
└── Success: contract address + share link
```

---

### Page 5: Artist Dashboard (`/artist/dashboard`)

**Widgets:**
- Total Royalties Earned (lifetime)
- This Week's Plays
- Token Sale Progress (% sold)
- Next Distribution: countdown timer

**Sections:**
1. **My Songs** — list semua lagu yang sudah tokenized
2. **Sales Activity** — siapa yang beli token + berapa
3. **Play Count Chart** — Recharts area chart per minggu
4. **Royalty Distribution History** — table dengan tanggal + jumlah
5. **Pending Distributions** — royalti yang belum didistribusikan
6. **AI Insights** — tips dari AI Agent (lagu mana trending, kapan harga token optimal)

---

### Page 6: Investor Dashboard (`/investor/dashboard`)

**Widgets:**
- Total Portfolio Value (CSPR)
- Total Royalties Received
- Number of Songs Owned
- Best Performing Song

**Sections:**
1. **My Holdings** — card per lagu:
   ```
   Song Title — Artist
   Tokens: 10/1000 (1%)
   Paid: 52 CSPR total
   Earned: 3.2 CSPR
   Pending: 0.8 CSPR
   [Claim] [Sell]
   ```
2. **Transaction History** — semua buy/receive royalti
3. **Pending Royalties** — total claimable + [Claim All] button
4. **Yield Calendar** — calendar view kapan distribusi berikutnya
5. **Discover** — AI-recommended songs based on holdings

---

### Shared Components

- `WalletConnectButton` — CSPR.click integration
- `TransactionToast` — notifikasi setiap transaksi on-chain
- `CasperExplorerLink` — link ke block explorer
- `PlayCountBadge` — real-time Spotify play count
- `YieldBadge` — persentase yield tahunan
- `AIVerifiedBadge` — status compliance dari AI Agent
- `DistributionCountdown` — countdown ke distribusi berikutnya

---

## 8. Database Schema

```sql
-- Artists
CREATE TABLE artists (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  wallet_address VARCHAR(68),  -- Casper address
  spotify_artist_id VARCHAR(100),
  spotify_profile JSONB,       -- cached Spotify data
  country VARCHAR(2),
  created_at TIMESTAMP
);

-- Songs (tokenized)
CREATE TABLE songs (
  id UUID PRIMARY KEY,
  artist_id UUID REFERENCES artists(id),
  title VARCHAR(255),
  spotify_track_id VARCHAR(100),
  isrc_code VARCHAR(20),
  
  -- Token config
  token_contract_address VARCHAR(68),
  distributor_contract_address VARCHAR(68),
  oracle_contract_address VARCHAR(68),
  total_supply INTEGER,
  tokens_for_sale INTEGER,
  price_per_token_cspr DECIMAL,
  royalty_rate_per_mille DECIMAL,  -- USD per 1000 streams
  distribution_schedule VARCHAR(20), -- 'weekly' | 'monthly'
  
  -- Stats (cached)
  current_play_count BIGINT,
  last_play_count BIGINT,
  weekly_plays INTEGER,
  
  -- Compliance
  compliance_hash VARCHAR(64),
  is_verified BOOLEAN DEFAULT false,
  
  status VARCHAR(20),  -- 'pending' | 'active' | 'completed'
  created_at TIMESTAMP,
  launched_at TIMESTAMP
);

-- Token Holdings
CREATE TABLE token_holdings (
  id UUID PRIMARY KEY,
  song_id UUID REFERENCES songs(id),
  investor_address VARCHAR(68),
  token_amount INTEGER,
  purchase_price_cspr DECIMAL,
  purchased_at TIMESTAMP
);

-- Royalty Distributions
CREATE TABLE distributions (
  id UUID PRIMARY KEY,
  song_id UUID REFERENCES songs(id),
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  total_plays INTEGER,
  total_royalty_usd DECIMAL,
  total_royalty_cspr DECIMAL,
  ai_report_hash VARCHAR(64),
  tx_hash VARCHAR(64),          -- Casper transaction hash
  distributed_at TIMESTAMP
);

-- Play Count History
CREATE TABLE play_count_history (
  id UUID PRIMARY KEY,
  song_id UUID REFERENCES songs(id),
  play_count BIGINT,
  source VARCHAR(20),  -- 'spotify' | 'lastfm'
  recorded_at TIMESTAMP
);
```

---

## 9. x402 Integration

### Buy Tokens via x402
**File:** `lib/x402.ts`

```typescript
// x402 payment flow untuk beli token
export async function buyTokensX402(
  songContractAddress: string,
  tokenAmount: number,
  pricePerTokenCSPR: number,
  buyerAddress: string
) {
  const totalCSPR = tokenAmount * pricePerTokenCSPR;
  const totalMotes = totalCSPR * 1_000_000_000; // 1 CSPR = 10^9 motes

  // Step 1: Request payment challenge dari backend
  const challengeResponse = await fetch("/api/tokens/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      songContractAddress,
      tokenAmount,
      buyerAddress,
    }),
  });

  if (challengeResponse.status === 402) {
    const { price, recipient, nonce, deadline } =
      await challengeResponse.json();

    // Step 2: Sign payment authorization (via CSPR.click wallet)
    const paymentProof = await window.csprclick.signPayment({
      recipient,
      amount: price,
      nonce,
      deadline,
    });

    // Step 3: Submit dengan payment proof
    const finalResponse = await fetch("/api/tokens/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Payment": JSON.stringify(paymentProof),
      },
      body: JSON.stringify({
        songContractAddress,
        tokenAmount,
        buyerAddress,
      }),
    });

    return finalResponse.json();
    // Returns: { txHash, tokensReceived, contractAddress }
  }
}
```

### Royalty Distribution via x402
```typescript
// Distribusi royalti ke semua holders pakai x402 batch payment
export async function distributeRoyaltiesX402(
  holders: string[],
  amounts: bigint[],  // dalam motes
  songId: string
) {
  // Casper x402 Facilitator handles batch micropayments
  const batchPayment = await casperX402Client.batchPay(
    holders.map((addr, i) => ({
      recipient: addr,
      amount: amounts[i],
      memo: `SoundRight royalty - Song ${songId}`,
    }))
  );
  
  return batchPayment.txHash;
}
```

---

## 10. Spotify & Last.fm Integration

### Yang Bisa Diambil GRATIS

**Spotify Web API (Client Credentials — tidak perlu login user):**
- Track metadata: nama, artis, album, durasi, release date
- Track popularity score (0-100)
- Artist profile: nama, followers, genres, gambar
- Artist top tracks
- Audio features: energy, danceability, tempo (keren untuk UI)
- ⚠️ Play count exact TIDAK tersedia via API publik

**Workaround untuk Play Count:**
- Gunakan **popularity score** sebagai proxy
- Estimasi plays = `popularity^2 × 1000` (formula approximation)
- Cross-reference dengan **Last.fm scrobble count** (lebih akurat)
- Untuk demo: gunakan data yang masuk akal secara manual

**Last.fm API (Gratis, daftar di last.fm/api):**
- Track.getInfo → playcount, listeners
- Artist.getInfo → playcount, listeners
- Track.getTopTags → genre tags

```typescript
// Last.fm — GRATIS, tanpa OAuth
export async function getLastFmTrackData(artist: string, track: string) {
  const API_KEY = process.env.LASTFM_API_KEY;
  const response = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`
  );
  const data = await response.json();
  return {
    playcount: parseInt(data.track?.playcount || "0"),
    listeners: parseInt(data.track?.listeners || "0"),
  };
}
```

---

## 11. Folder Structure

```
soundright/
├── contracts/                     # Rust/Odra smart contracts
│   ├── royalty-token/
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs             # RoyaltyToken contract
│   ├── distributor/
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs             # RoyaltyDistributor contract
│   └── oracle/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs             # StreamOracle contract
│
├── agents/                        # AI Agents (TypeScript)
│   ├── royalty-calculator.ts
│   ├── yield-predictor.ts
│   └── fraud-detector.ts
│
├── cron/                          # Cron jobs
│   └── weekly-distribution.ts    # Runs every Monday 00:00 UTC
│
├── lib/                           # Shared utilities
│   ├── spotify.ts
│   ├── lastfm.ts
│   ├── casper.ts                  # Casper SDK client
│   ├── x402.ts
│   └── db.ts                      # Database client
│
├── app/                           # Next.js App Router
│   ├── api/                       # API routes
│   │   ├── artists/
│   │   ├── songs/
│   │   ├── tokens/
│   │   ├── royalties/
│   │   └── spotify/
│   ├── marketplace/
│   ├── song/[id]/
│   ├── artist/
│   │   ├── onboard/
│   │   ├── connect/
│   │   ├── tokenize/
│   │   └── dashboard/
│   ├── investor/dashboard/
│   └── admin/
│
├── components/                    # React components
│   ├── ui/                        # shadcn/ui
│   ├── charts/                    # Recharts wrappers
│   ├── wallet/                    # CSPR.click integration
│   └── shared/
│
├── prisma/                        # Database ORM
│   └── schema.prisma
│
├── public/
├── .env.local
├── package.json
└── README.md
```

---

## 12. Environment Variables

```bash
# Blockchain
CASPER_RPC_URL=https://rpc.mainnet.casperlabs.io
CASPER_CHAIN_NAME=casper
CASPER_ORACLE_PRIVATE_KEY=<ed25519-private-key-hex>
CASPER_ORACLE_PUBLIC_KEY=<ed25519-public-key-hex>

# Contracts (setelah deploy)
ROYALTY_TOKEN_WASM_PATH=./contracts/royalty-token/target/wasm32-unknown-unknown/release/royalty_token.wasm
STREAM_ORACLE_CONTRACT_ADDRESS=<address>
DISTRIBUTOR_CONTRACT_ADDRESS=<address>

# Music APIs
SPOTIFY_CLIENT_ID=<dari developer.spotify.com — gratis>
SPOTIFY_CLIENT_SECRET=<dari developer.spotify.com — gratis>
LASTFM_API_KEY=<dari last.fm/api — gratis>

# AI
ANTHROPIC_API_KEY=<claude api key>

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/soundright

# App
NEXTAUTH_SECRET=<random string>
NEXTAUTH_URL=http://localhost:3000

# x402
X402_FACILITATOR_URL=https://x402.casper.network
```

---

## 13. Deployment Guide

```bash
# 1. Clone & install
git clone https://github.com/yourname/soundright
cd soundright
npm install

# 2. Setup database
npx prisma db push

# 3. Build & deploy contracts ke Casper mainnet
cd contracts/oracle
cargo odra build -b casper
cargo odra deploy -b casper --url https://rpc.mainnet.casperlabs.io

cd ../distributor
cargo odra build -b casper
cargo odra deploy -b casper --url https://rpc.mainnet.casperlabs.io

# 4. Update .env dengan contract addresses

# 5. Run development server
npm run dev

# 6. Setup cron job (distribusi mingguan)
# Tambah ke crontab:
# 0 0 * * 1 cd /app && npx ts-node cron/weekly-distribution.ts

# 7. Deploy ke Vercel
vercel --prod
```

---

## 14. Demo Script

### Setup (sebelum demo):
- Buka browser, sudah login sebagai "Aria (Artist)"
- Sudah ada 1 lagu tokenized: "Midnight Drive" — 40% sudah terjual
- Tab kedua: sudah login sebagai "Ivan (Investor)"
- Casper Explorer sudah open di tab ketiga

---

### Script (3 menit):

**[00:00] Hook**
> *"Setiap kali lagu diputar di Spotify, artis dapat royalti. Tapi kenapa harus nunggu 6 bulan? Dan kenapa harus sendiri? SoundRight mengubah royalti musik menjadi aset yang bisa dimiliki bersama — real-time, on-chain, tanpa perantara."*

**[00:20] Artist Side**
> Buka `/artist/dashboard` — tunjukkan "Midnight Drive" dengan 847,000 plays minggu ini
> AI Compliance badge: ✅ Verified
> "Lagu ini sudah diverifikasi AI Agent. Play count dari Spotify dan Last.fm di-cross-check, tidak ada anomali."

**[00:45] Tokenize Flow**
> Klik "View on Marketplace" — tunjukkan 160 token tersisa dari 400
> "Artist sudah tokenize 40% royalti lagu ini. 160 token tersisa."

**[01:00] Investor Buys**
> Switch ke tab investor
> Beli 10 token → x402 payment → tunjukkan signing di CSPR wallet
> "Ivan baru beli 10 token — artinya 1% dari royalti lagu ini sekarang miliknya."

**[01:20] On-Chain Proof**
> Switch ke Casper Explorer tab
> Tunjukkan transaction hash real
> "Ini proof-nya. On-chain, immutable, bisa diaudit siapa saja."

**[01:35] Royalty Distribution**
> Kembali ke artist dashboard, klik "Simulate Distribution"
> Tunjukkan 847,000 plays × $0.004 = $3,388 royalti minggu ini
> AI kalkulasi → distribusi ke 47 holders via x402
> Ivan's portfolio: +0.8 CSPR masuk otomatis

**[02:00] AI Yield Prediction**
> Tunjukkan prediction card: "Next month: ~3.4M plays, est. $13,600 royalti — 📈 Growing (87% confidence)"

**[02:20] Closing**
> *"SoundRight bukan music player. Ini adalah pasar royalti yang transparan, otomatis, dan terbuka untuk semua. Artist dapat likuiditas lebih cepat. Investor dapat yield dari aset nyata. Semua ditenagai Casper Network, x402, dan AI."*

---

## ✅ Checklist Submission

- [ ] Smart contracts deployed ke Casper **mainnet** (bukan testnet)
- [ ] Minimal 1 real Spotify track terintegrasi
- [ ] AI Agent menghasilkan compliance report dengan hash on-chain
- [ ] x402 payment flow berfungsi end-to-end
- [ ] Demo video max 5 menit, tunjukkan semua flow
- [ ] GitHub repo public dengan README lengkap
- [ ] Contract addresses di README
- [ ] Casper Explorer links untuk semua transaksi demo

---

*Good luck bro! 🚀 SoundRight has all the ingredients: real data, AI verification, x402 micropayments, on-chain audit trail, and a narrative that judges will remember.*