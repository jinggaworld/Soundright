/**
 * x402 Payment Integration for SoundRight
 *
 * x402 is a payment protocol for micropayments on Casper Network.
 * This module handles token purchases and royalty distributions.
 */

interface PaymentSigner {
  signPayment: (args: {
    recipient: string;
    amount: number;
    nonce: string;
    deadline: string;
  }) => Promise<unknown>;
}

// Buy tokens via x402 payment challenge/response flow
export async function buyTokensX402(
  songId: string,
  tokenAmount: number,
  buyerAddress: string,
  signer: PaymentSigner
) {
  // Step 1: Request payment challenge from backend
  const challengeResponse = await fetch("/api/tokens/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ songId, tokenAmount, buyerAddress }),
  });

  if (challengeResponse.status === 402) {
    const { price, recipient, nonce, deadline } =
      await challengeResponse.json();

    // Step 2: Sign payment authorization via provided signer
    const paymentProof = await signer.signPayment({
      recipient,
      amount: price,
      nonce,
      deadline,
    });

    // Step 3: Submit with payment proof
    const finalResponse = await fetch("/api/tokens/buy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Payment": JSON.stringify(paymentProof),
      },
      body: JSON.stringify({ songId, tokenAmount, buyerAddress }),
    });

    if (!finalResponse.ok) {
      const error = await finalResponse.json();
      throw new Error(error.error || "Payment failed");
    }

    return finalResponse.json();
  }

  const error = await challengeResponse.json();
  throw new Error(error.error || "Payment challenge failed");
}

// Distribute royalties to all holders via x402 batch payment
export async function distributeRoyaltiesX402(
  holders: string[],
  amounts: bigint[],
  songId: string
) {
  const response = await fetch("/api/royalties/distribute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      holders,
      amounts: amounts.map((a) => a.toString()),
      songId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Distribution failed");
  }

  return response.json();
}

// Claim pending royalties for a wallet address
export async function claimRoyalties(walletAddress: string, songId?: string) {
  const response = await fetch("/api/royalties/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, songId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Claim failed");
  }

  return response.json();
}
