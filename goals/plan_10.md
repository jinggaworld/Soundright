# Plan 10: x402 Payment Integration

## Overview
Implementasi payment flow untuk membeli token via x402 micropayments dan distribusi royalti ke token holders.

## Goals
- Buy tokens via x402 payment
- Payment challenge/response flow
- CSPR.click wallet signing
- Transaction confirmation
- Receipt generation

## Tasks

### 10.1 Buy Token Endpoint (app/api/tokens/buy/route.ts)
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const paymentProof = req.headers.get("X-Payment");
  const body = await req.json();
  const { songContractAddress, tokenAmount, buyerAddress } = body;

  // If no payment proof, return 402 with payment challenge
  if (!paymentProof) {
    const song = await prisma.song.findFirst({
      where: { tokenContractAddress: songContractAddress },
    });

    if (!song) return errorResponse("Song not found", 404);
    if (song.tokensForSale! < tokenAmount) return errorResponse("Not enough tokens available");

    const totalCSPR = tokenAmount * Number(song.pricePerTokenCspr);
    const totalMotes = BigInt(Math.round(totalCSPR * 1_000_000_000));

    return Response.json(
      {
        price: totalMotes.toString(),
        recipient: song.tokenContractAddress,
        nonce: crypto.randomUUID(),
        deadline: Date.now() + 300000, // 5 minutes
      },
      { status: 402 }
    );
  }

  // Verify payment proof and execute purchase
  try {
    // Parse and verify the payment proof
    const proof = JSON.parse(paymentProof);

    // TODO: Verify signature against Casper network
    // For now, trust the wallet extension

    // Update database
    await prisma.song.update({
      where: { tokenContractAddress: songContractAddress },
      data: {
        tokensForSale: { decrement: tokenAmount },
      },
    });

    // Record the holding
    await prisma.tokenHolding.create({
      data: {
        songId: (await prisma.song.findFirst({
          where: { tokenContractAddress: songContractAddress },
        }))!.id,
        investorAddress: buyerAddress,
        tokenAmount,
        purchasePriceCspr: tokenAmount * Number((await prisma.song.findFirst({
          where: { tokenContractAddress: songContractAddress },
        }))!.pricePerTokenCspr),
      },
    });

    return successResponse({
      txHash: proof.txHash || "pending",
      tokensReceived: tokenAmount,
      contractAddress: songContractAddress,
    });
  } catch (error) {
    return errorResponse("Payment verification failed", 400);
  }
}
```

### 10.2 Claim Royalties Endpoint (app/api/royalties/claim/route.ts)
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const { walletAddress, songId } = await req.json();

  // Get holdings for this user
  const holdings = await prisma.tokenHolding.findMany({
    where: {
      investorAddress: walletAddress,
      ...(songId && { songId }),
    },
  });

  if (holdings.length === 0) {
    return errorResponse("No holdings found");
  }

  // Calculate pending royalties
  let totalPending = 0;
  for (const holding of holdings) {
    const song = await prisma.song.findUnique({ where: { id: holding.songId } });
    if (!song) continue;

    // Calculate royalty based on play count delta * royalty rate * share
    const share = holding.tokenAmount / song.totalSupply!;
    const estimatedRoyalty = Number(song.currentPlayCount) * (Number(song.royaltyRatePerMille) / 1000) * share;
    totalPending += estimatedRoyalty;
  }

  if (totalPending <= 0) {
    return errorResponse("No pending royalties");
  }

  // TODO: Execute x402 payment to user's wallet
  // For now, record the claim
  return successResponse({
    pendingAmount: totalPending,
    message: "Royalties claimed successfully",
    // txHash will be added after x402 integration
  });
}
```

### 10.3 Frontend: Buy Token Widget (components/song/BuyTokenWidget.tsx)
```typescript
"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Wallet, Loader2, CheckCircle } from "lucide-react";

interface Props {
  song: {
    id: string;
    tokenContractAddress: string;
    pricePerTokenCspr: number;
    tokensForSale: number;
    totalSupply: number;
  };
}

export function BuyTokenWidget({ song }: Props) {
  const { isConnected, address } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalCost = quantity * song.pricePerTokenCspr;
  const sharePercentage = ((quantity / song.totalSupply) * 100).toFixed(2);

  async function handleBuy() {
    if (!isConnected || !address) return;
    setLoading(true);

    try {
      // Step 1: Get payment challenge
      const challengeRes = await fetch("/api/tokens/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songContractAddress: song.tokenContractAddress,
          tokenAmount: quantity,
          buyerAddress: address,
        }),
      });

      if (challengeRes.status === 402) {
        const challenge = await challengeRes.json();

        // Step 2: Sign payment with CSPR.click
        const paymentProof = await (window as any).csprclick.signPayment({
          recipient: challenge.recipient,
          amount: challenge.price,
          nonce: challenge.nonce,
          deadline: challenge.deadline,
        });

        // Step 3: Submit payment
        const finalRes = await fetch("/api/tokens/buy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": JSON.stringify(paymentProof),
          },
          body: JSON.stringify({
            songContractAddress: song.tokenContractAddress,
            tokenAmount: quantity,
            buyerAddress: address,
          }),
        });

        if (finalRes.ok) {
          setSuccess(true);
        }
      }
    } catch (error) {
      console.error("Buy failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-sr">
      <h3 className="mb-4 text-lg font-bold text-sr-text">Buy Tokens</h3>

      <div className="mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-sr-text-secondary">Token Price</span>
          <span className="font-bold text-sr-text">{song.pricePerTokenCspr} CSPR</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-sr-text-secondary">Available</span>
          <span className="text-sr-text">{song.tokensForSale} tokens</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm text-sr-text-secondary">Quantity</label>
        <input
          type="number"
          min={1}
          max={song.tokensForSale}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="input-sr"
        />
      </div>

      <div className="mb-4 rounded-lg bg-sr-mid p-3">
        <div className="flex justify-between text-sm">
          <span className="text-sr-text-secondary">Total Cost</span>
          <span className="font-bold text-sr-green">{totalCost.toFixed(2)} CSPR</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-sr-text-secondary">Your Share</span>
          <span className="text-sr-text">{sharePercentage}%</span>
        </div>
      </div>

      {success ? (
        <div className="flex items-center justify-center gap-2 rounded-full bg-sr-green/20 py-3 text-sr-green">
          <CheckCircle size={16} />
          <span className="font-bold">Purchase Successful!</span>
        </div>
      ) : (
        <button
          onClick={handleBuy}
          disabled={!isConnected || loading || song.tokensForSale < quantity}
          className="btn-pill-green flex w-full items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Wallet size={16} />
          )}
          {loading ? "Processing..." : "Buy via x402"}
        </button>
      )}

      {!isConnected && (
        <p className="mt-2 text-center text-xs text-sr-text-secondary">
          Connect your CSPR wallet to buy tokens
        </p>
      )}
    </div>
  );
}
```

## Deliverables
- [ ] POST /api/tokens/buy (payment challenge + verification)
- [ ] POST /api/royalties/claim (claim pending royalties)
- [ ] BuyTokenWidget component
- [ ] x402 payment flow integration
- [ ] CSPR.click wallet signing

## Dependencies
- Plan 1 (Architecture)
- Plan 2 (Casper Integration)
- Plan 7 (Backend API)
- Plan 9 (Song Detail Page)

## Notes
- **x402 Protocol**: Payment challenge → Sign → Submit flow
- **No Fake Data**: Transaksi nyata on-chain
- **Rate Limiting**: Protect buy endpoint from abuse
- **Validation**: Check token availability before payment
