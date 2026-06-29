# Plan 20: Deployment, CI/CD & Demo Preparation

## Overview
Setup deployment pipeline, CI/CD configuration, dan demo preparation untuk Casper Agentic Buildathon 2026 submission.

## Goals
- Vercel deployment configuration
- Environment variables setup
- CI/CD pipeline (GitHub Actions)
- Demo script preparation
- Documentation (README)
- Submission checklist

## Tasks

### 20.1 Vercel Configuration (vercel.json)
```json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["sin1"],
  "crons": [
    {
      "path": "/api/cron/weekly-distribution",
      "schedule": "0 0 * * 1"
    }
  ]
}
```

### 20.2 GitHub Actions CI (/.github/workflows/ci.yml)
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup PostgreSQL
        uses: harmon758/postgresql-compose@master
        with:
          postgres version: "15"

      - name: Setup Prisma
        run: |
          npx prisma generate
          npx prisma db push

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typescript

      - name: Build
        run: npm run build

  contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install Odra
        run: cargo install odra

      - name: Build contracts
        run: |
          cd contracts/royalty-token && cargo odra build -b casper-test
          cd ../oracle && cargo odra build -b casper-test
          cd ../distributor && cargo odra build -b casper-test
```

### 20.3 Deployment Script (scripts/deploy.sh)
```bash
#!/bin/bash
set -e

echo "🚀 Deploying SoundRight to Production..."

# 1. Run tests
echo "Running tests..."
npm test

# 2. Build
echo "Building..."
npm run build

# 3. Deploy contracts to Casper testnet
echo "Deploying smart contracts..."
cd contracts
./scripts/deploy-contracts.sh

# 4. Update environment variables
echo "Update Vercel environment variables with contract addresses"
# vercel env add ROYALTY_TOKEN_CONTRACT_ADDRESS production
# vercel env add STREAM_ORACLE_CONTRACT_ADDRESS production
# vercel env add DISTRIBUTOR_CONTRACT_ADDRESS production

# 5. Deploy to Vercel
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "URL: https://soundright.vercel.app"
```

### 20.4 README.md
```markdown
# 🎵 SoundRight

> **Casper Agentic Buildathon 2026 | Track: RWA Tokenization**
> Built on Casper Network · Powered by x402 · AI-driven Royalty Engine

## 🎯 What is SoundRight?

SoundRight enables musicians to **tokenize their song royalties** on Casper Network. Investors can buy tokens representing a % of royalties. Every week, AI Agents pull real Spotify data, calculate royalties, and distribute payments automatically via x402 micropayments — all on-chain, transparent, no intermediaries.

## 🔑 Key Features

- **Fully on-chain royalty distribution** via Casper smart contracts
- **AI Royalty Agent** that verifies and calculates stream data (powered by Groq/LLaMA)
- **x402 micropayments** for automatic per-holder distribution
- **Fraud detection** — AI detects stream farming anomalies
- **Real Spotify data** — not simulation, real play counts

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOUNDRIGHT PLATFORM                       │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend → Backend API → Casper Network                 │
│                                  ↗ Spotify API                   │
│                                  ↗ Last.fm API                   │
│                                  ↗ Groq AI (LLaMA)              │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Casper testnet account with CSPR
- Spotify Developer Account
- Last.fm Account
- Groq API Key (free)

### Installation

```bash
git clone https://github.com/yourname/soundright
cd soundright
npm install
```

### Setup

```bash
# Copy environment variables
cp .env.example .env.local

# Fill in your API keys:
# - GROQ_API_KEY (from console.groq.com)
# - SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET
# - LASTFM_API_KEY
# - CASPER_ORACLE_PRIVATE_KEY
# - DATABASE_URL

# Setup database
npx prisma db push

# Run development server
npm run dev
```

## 📦 Smart Contracts

Three Odra smart contracts on Casper testnet:

| Contract | Address | Purpose |
|----------|---------|---------|
| RoyaltyToken | `TODO` | ERC-20 style royalty tokens |
| StreamOracle | `TODO` | Verified play count storage |
| RoyaltyDistributor | `TODO` | Automatic royalty distribution |

## 🌐 Deployed URLs

- **Frontend**: https://soundright.vercel.app
- **Casper Explorer**: https://cspr.cloud

## 🤖 AI Integration

SoundRight uses **Groq API** (free tier) with LLaMA 3.3 70B model for:
- Royalty verification and calculation
- Yield prediction
- Fraud detection
- Song recommendations

Fallback: **NVIDIA NIM API** with Mistral/Qwen models

## 📊 API Endpoints

```
POST   /api/auth/connect          → Wallet authentication
GET    /api/artists/:id/dashboard → Artist dashboard data
POST   /api/songs/tokenize        → Tokenize a song
GET    /api/songs                 → Browse marketplace
GET    /api/songs/:id             → Song detail
POST   /api/tokens/buy            → Buy tokens via x402
GET    /api/tokens/my-holdings    → Investor portfolio
POST   /api/royalties/claim       → Claim royalties
POST   /api/royalties/distribute  → Trigger distribution (cron)
```

## 🎬 Demo Script

### Setup
- Browser 1: Logged in as Artist
- Browser 2: Logged in as Investor
- Browser 3: Casper Explorer

### Flow (3 minutes)
1. **[0:00]** Artist dashboard — show "Midnight Drive" with real play count
2. **[0:20]** AI Compliance badge — ✅ Verified
3. **[0:45]** Marketplace — show 160 tokens available
4. **[1:00]** Investor buys 10 tokens via x402
5. **[1:20]** Casper Explorer — show on-chain transaction
6. **[1:35]** Simulate royalty distribution
7. **[2:00]** AI Yield Prediction — next month forecast
8. **[2:20]** Closing statement

## 📋 Buildathon Checklist

- [x] Smart contracts deployed to Casper **testnet**
- [x] Real Spotify track integration
- [x] AI Agent generating compliance reports with on-chain hash
- [x] x402 payment flow end-to-end
- [ ] Demo video max 5 minutes
- [ ] GitHub repo public with README
- [ ] Contract addresses in README
- [ ] Casper Explorer links for all demo transactions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Blockchain**: Casper Network, Odra Framework (Rust)
- **AI**: Groq API (LLaMA 3.3), NVIDIA NIM fallback
- **Payments**: x402 micropayments
- **Music Data**: Spotify Web API, Last.fm API
- **Wallet**: CSPR.click

## 📄 License

MIT
```

### 20.5 Demo Video Script (goals/demo-script.md)
```markdown
# SoundRight Demo Script

## Pre-Demo Checklist
- [ ] Browser 1: Artist account logged in
- [ ] Browser 2: Investor account logged in
- [ ] Browser 3: Casper Explorer open
- [ ] All wallets connected
- [ ] Network stable

## Script

### [0:00-0:20] Hook
> "Every time a song plays on Spotify, the artist earns royalties. But why wait 6 months? And why alone? SoundRight tokenizes music royalties into tradable assets — real-time, on-chain, no middlemen."

### [0:20-0:45] Artist Dashboard
- Show `/artist/dashboard`
- Highlight "Midnight Drive" with 847,000 plays this week
- Show AI Compliance badge: ✅ Verified
- "This song is verified by our AI Agent. Spotify and Last.fm play counts are cross-checked, no anomalies."

### [0:45-1:00] Marketplace
- Show `/marketplace`
- Point out 160 tokens remaining from 400
- "The artist tokenized 40% of this song's royalties. 160 tokens left."

### [1:00-1:20] Investor Purchase
- Switch to investor browser
- Buy 10 tokens → x402 payment → CSPR wallet signing
- "Ivan just bought 10 tokens — that's 1% of this song's royalties now belongs to him."

### [1:20-1:35] On-Chain Proof
- Switch to Casper Explorer
- Show real transaction hash
- "Here's the proof. On-chain, immutable, auditable by anyone."

### [1:35-2:00] Royalty Distribution
- Back to artist dashboard
- Click "Simulate Distribution"
- Show 847,000 plays × $0.004 = $3,388 royalty this week
- AI calculates → distributes to 47 holders via x402
- Ivan's portfolio: +0.8 CSPR auto-deposited

### [2:00-2:20] AI Yield Prediction
- Show prediction card: "Next month: ~3.4M plays, est. $13,600 royalty — 📈 Growing (87% confidence)"

### [2:20-2:45] Closing
> "SoundRight isn't a music player. It's a transparent, automated, open royalty marketplace. Artists get faster liquidity. Investors earn yield from real assets. Powered by Casper Network, x402, and AI."
```

## Deliverables
- [ ] Vercel configuration
- [ ] GitHub Actions CI/CD
- [ ] Deployment script
- [ ] Comprehensive README
- [ ] Demo script
- [ ] Buildathon checklist

## Dependencies
- All previous plans (1-18)

## Notes
- **Deployment**: Vercel untuk frontend + API
- **CI/CD**: GitHub Actions untuk automated testing
- **Documentation**: README lengkap untuk submission
- **Demo**: Script terstruktur untuk 3 menit demo
- **Checklist**: Semua requirements buildathon terpenuhi
