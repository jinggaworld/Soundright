# Plan 1: Project Architecture & Development Environment Setup

## Overview
Setup monorepo SoundRight dengan seluruh tooling, konfigurasi, dan struktur folder yang siap untuk parallel development (backend + frontend + smart contracts).

## Goals
- Inisialisasi Next.js 14+ App Router project
- Setup Tailwind CSS dengan design system Spotify-inspired
- Konfigurasi TypeScript strict mode
- Setup Prisma ORM + PostgreSQL
- Konfigurasi ESLint + Prettier
- Setup folder structure sesuai plan.md

## Tasks

### 1.1 Initialize Next.js Project
```bash
npx create-next-app@latest soundright --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd soundright
```

### 1.2 Install Core Dependencies
```bash
# Core
npm install next react react-dom

# Database
npm install prisma @prisma/client

# Casper Network
npm install casper-js-sdk casper-click-sdk

# AI (Groq - OpenAI compatible)
npm install groq-sdk

# UI Components
npm install recharts lucide-react clsx tailwind-merge

# Utilities
npm install date-fns

# Dev Dependencies
npm install -D @types/node @types/react @types/react-dom typescript
```

### 1.3 Folder Structure
```
soundright/
├── contracts/                     # Rust/Odra smart contracts
│   ├── royalty-token/
│   ├── distributor/
│   └── oracle/
├── agents/                        # AI Agents (TypeScript)
│   ├── royalty-calculator.ts
│   ├── yield-predictor.ts
│   └── fraud-detector.ts
├── cron/                          # Cron jobs
│   └── weekly-distribution.ts
├── lib/                           # Shared utilities
│   ├── spotify.ts
│   ├── lastfm.ts
│   ├── casper.ts
│   ├── x402.ts
│   └── db.ts
├── app/                           # Next.js App Router
│   ├── api/
│   ├── marketplace/
│   ├── song/[id]/
│   ├── artist/
│   ├── investor/
│   └── admin/
├── components/                    # React components
│   ├── ui/
│   ├── charts/
│   ├── wallet/
│   └── shared/
├── prisma/
│   └── schema.prisma
├── .env.local
├── package.json
└── tsconfig.json
```

### 1.4 Tailwind Configuration (design-system.ts)
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand
        "sr-green": "#1ed760",
        "sr-green-dark": "#1db954",
        "sr-black": "#121212",
        "sr-surface": "#181818",
        "sr-mid": "#1f1f1f",
        "sr-card": "#252525",
        // Text
        "sr-text": "#ffffff",
        "sr-text-secondary": "#b3b3b3",
        "sr-text-near": "#cbcbcb",
        // Semantic
        "sr-negative": "#f3727f",
        "sr-warning": "#ffa42b",
        "sr-announcement": "#539df5",
        // Border
        "sr-border": "#4d4d4d",
        "sr-border-light": "#7c7c7c",
      },
      fontFamily: {
        spotify: [
          "SpotifyMixUI",
          "CircularSp-Arab",
          "CircularSp-Hebr",
          "CircularSp-Cyrl",
          "CircularSp-Grek",
          "CircularSp-Deva",
          "Helvetica Neue",
          "helvetica",
          "arial",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Meiryo",
          "MS Gothic",
          "sans-serif",
        ],
        "spotify-title": [
          "SpotifyMixUITitle",
          "CircularSp-Arab",
          "CircularSp-Hebr",
          "CircularSp-Cyrl",
          "CircularSp-Grek",
          "CircularSp-Deva",
          "Helvetica Neue",
          "helvetica",
          "arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        pill: "500px",
        "full-pill": "9999px",
      },
      boxShadow: {
        heavy: "rgba(0,0,0,0.5) 0px 8px 24px",
        medium: "rgba(0,0,0,0.3) 0px 8px 8px",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};

export default config;
```

### 1.5 Global CSS (globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --sr-green: #1ed760;
  --sr-black: #121212;
  --sr-surface: #181818;
  --sr-mid: #1f1f1f;
  --text-base: #ffffff;
  --text-secondary: #b3b3b3;
  --text-near: #cbcbcb;
}

body {
  background-color: var(--sr-black);
  color: var(--text-base);
  font-family: "SpotifyMixUI", "Helvetica Neue", helvetica, arial, sans-serif;
}

/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 12px;
}
::-webkit-scrollbar-track {
  background: #121212;
}
::-webkit-scrollbar-thumb {
  background: #535353;
  border-radius: 6px;
}
::-webkit-scrollbar-thumb:hover {
  background: #636363;
}

/* Pill button base */
.btn-pill {
  @apply rounded-full px-8 py-3 font-bold uppercase tracking-wider transition-all;
  @apply bg-sr-mid text-sr-text hover:bg-sr-card hover:scale-105;
  letter-spacing: 1.4px;
}

.btn-pill-green {
  @apply btn-pill bg-sr-green text-black hover:bg-sr-green-dark;
}

.btn-pill-outline {
  @apply btn-pill bg-transparent border border-sr-border-light text-sr-text;
}

/* Card base */
.card-sr {
  @apply bg-sr-surface rounded-lg p-4 transition-shadow;
  box-shadow: none;
}
.card-sr:hover {
  box-shadow: rgba(0,0,0,0.3) 0px 8px 8px;
}

/* Input base */
.input-sr {
  @apply w-full rounded-pill bg-sr-mid text-sr-text px-4 py-3;
  box-shadow: rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset;
}
.input-sr:focus {
  @apply outline-none;
  box-shadow: rgb(18,18,18) 0px 1px 0px, rgb(0,0,0) 0px 0px 0px 1px inset;
}

/* Badge */
.badge-sr {
  @apply inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold;
  text-transform: capitalize;
}
```

### 1.6 TypeScript Config (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "contracts"]
}
```

### 1.7 Environment Variables Template (.env.example)
```bash
# Blockchain
CASPER_RPC_URL=https://rpc.testnet.casperlabs.io
CASPER_CHAIN_NAME=casper-test
CASPER_ORACLE_PRIVATE_KEY=
CASPER_ORACLE_PUBLIC_KEY=

# Contracts (setelah deploy)
ROYALTY_TOKEN_WASM_PATH=./contracts/royalty-token/target/wasm32-unknown-unknown/release/royalty_token.wasm
STREAM_ORACLE_CONTRACT_ADDRESS=
DISTRIBUTOR_CONTRACT_ADDRESS=

# Music APIs (GRATIS)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
LASTFM_API_KEY=

# AI - Groq (FREE TIER - OpenAI compatible)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

# AI - NVIDIA NIM (Fallback, FREE for prototyping)
NVIDIA_NIM_API_KEY=
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=meta/llama-3.3-70b-instruct

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/soundright

# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# x402
X402_FACILITATOR_URL=https://x402.casper.network
```

### 1.8 Database Schema (Prisma)
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Artist {
  id                String   @id @default(uuid())
  name              String
  email             String   @unique
  walletAddress     String   @map("wallet_address")
  spotifyArtistId   String?  @map("spotify_artist_id")
  spotifyProfile    Json?    @map("spotify_profile")
  country           String?
  createdAt         DateTime @default(now()) @map("created_at")

  songs             Song[]

  @@map("artists")
}

model Song {
  id                        String   @id @default(uuid())
  artistId                  String   @map("artist_id")
  title                     String
  spotifyTrackId            String   @map("spotify_track_id")
  isrcCode                  String?  @map("isrc_code")

  // Token config
  tokenContractAddress      String?  @map("token_contract_address")
  distributorContractAddress String? @map("distributor_contract_address")
  oracleContractAddress     String?  @map("oracle_contract_address")
  totalSupply               Int?     @map("total_supply")
  tokensForSale             Int?     @map("tokens_for_sale")
  pricePerTokenCspr         Decimal? @map("price_per_token_cspr")
  royaltyRatePerMille       Decimal? @map("royalty_rate_per_mille")
  distributionSchedule      String?  @default("weekly") @map("distribution_schedule")

  // Stats
  currentPlayCount          BigInt?  @map("current_play_count")
  lastPlayCount             BigInt?  @map("last_play_count")
  weeklyPlays               Int?     @map("weekly_plays")

  // Compliance
  complianceHash            String?  @map("compliance_hash")
  isVerified                Boolean  @default(false) @map("is_verified")

  status                    String   @default("pending")
  createdAt                 DateTime @default(now()) @map("created_at")
  launchedAt                DateTime? @map("launched_at")

  artist                    Artist   @relation(fields: [artistId], references: [id])
  holdings                  TokenHolding[]
  distributions             Distribution[]
  playCountHistory          PlayCountHistory[]

  @@map("songs")
}

model TokenHolding {
  id               String   @id @default(uuid())
  songId           String   @map("song_id")
  investorAddress  String   @map("investor_address")
  tokenAmount      Int      @map("token_amount")
  purchasePriceCspr Decimal @map("purchase_price_cspr")
  purchasedAt      DateTime @default(now()) @map("purchased_at")

  song             Song     @relation(fields: [songId], references: [id])

  @@map("token_holdings")
}

model Distribution {
  id                String   @id @default(uuid())
  songId            String   @map("song_id")
  periodStart       DateTime @map("period_start")
  periodEnd         DateTime @map("period_end")
  totalPlays        Int      @map("total_plays")
  totalRoyaltyUsd   Decimal  @map("total_royalty_usd")
  totalRoyaltyCspr  Decimal  @map("total_royalty_cspr")
  aiReportHash      String?  @map("ai_report_hash")
  txHash            String?  @map("tx_hash")
  distributedAt     DateTime @default(now()) @map("distributed_at")

  song              Song     @relation(fields: [songId], references: [id])

  @@map("distributions")
}

model PlayCountHistory {
  id           String   @id @default(uuid())
  songId       String   @map("song_id")
  playCount    BigInt   @map("play_count")
  source       String   // 'spotify' | 'lastfm'
  recordedAt   DateTime @default(now()) @map("recorded_at")

  song         Song     @relation(fields: [songId], references: [id])

  @@map("play_count_history")
}
```

### 1.9 Database Client Utility (lib/db.ts)
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

## Deliverables
- [ ] Next.js project initialized with TypeScript + Tailwind
- [ ] Folder structure created per plan.md
- [ ] Tailwind config with Spotify-inspired design tokens
- [ ] Global CSS with component base classes
- [ ] Prisma schema with all database models
- [ ] Database client utility
- [ ] Environment variables template
- [ ] ESLint + Prettier configured

## Dependencies
- Node.js 18+
- PostgreSQL database running locally or remote
- Spotify Developer Account (for Client ID/Secret)
- Last.fm Account (for API Key)
- Groq Console Account (for API Key)
- NVIDIA Developer Account (for NIM API Key)

## Notes
- **AI Provider**: Gunakan Groq API sebagai primary (free tier, OpenAI-compatible). Fallback ke NVIDIA NIM.
- **No Anthropic**: Tidak menggunakan Claude API dikarenakan berbayar.
- **Database**: PostgreSQL via Prisma, bisa pakai Neon/Supabase free tier.
- **Spotify API**: Client Credentials flow, tidak perlu user login.
- **Last.fm API**: Gratis tanpa OAuth.
