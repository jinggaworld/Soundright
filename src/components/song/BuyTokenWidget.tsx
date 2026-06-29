"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { Wallet, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SongInfo {
  id: string;
  title: string;
  pricePerTokenCspr: number | null;
  tokensForSale: number | null;
  totalSupply: number | null;
}

interface Props {
  song: SongInfo;
}

export function BuyTokenWidget({ song }: Props) {
  const { isConnected, address } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const pricePerToken = song.pricePerTokenCspr ?? 0;
  const totalCost = quantity * pricePerToken;
  const available = song.tokensForSale ?? 0;
  const totalSupply = song.totalSupply ?? 1;
  const sharePercentage = ((quantity / totalSupply) * 100).toFixed(2);

  async function handleBuy() {
    if (!isConnected || !address) return;
    setLoading(true);
    setError("");

    try {
      // Step 1: Get payment challenge from backend
      const challengeRes = await fetch("/api/tokens/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: song.id,
          tokenAmount: quantity,
          buyerAddress: address,
        }),
      });

      const challengeData = await challengeRes.json();

      if (challengeRes.status === 402 && challengeData.price) {
        // Step 2: Sign payment with CSPR.click wallet
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const csprclick = (window as any).csprclick as { signPayment?: (args: unknown) => Promise<unknown> } | undefined;
        if (!csprclick?.signPayment) {
          throw new Error("CSPR.click wallet not found. Please install the extension.");
        }

        const paymentProof = await csprclick.signPayment({
          recipient: challengeData.recipient,
          amount: challengeData.price,
          nonce: challengeData.nonce,
          deadline: challengeData.deadline,
        });

        // Step 3: Submit payment with proof
        const finalRes = await fetch("/api/tokens/buy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": JSON.stringify(paymentProof),
          },
          body: JSON.stringify({
            songId: song.id,
            tokenAmount: quantity,
            buyerAddress: address,
          }),
        });

        const finalData = await finalRes.json();

        if (finalData.success) {
          setSuccess(true);
        } else {
          setError(finalData.error || "Payment failed");
        }
      } else if (!challengeData.success) {
        setError(challengeData.error || "Failed to create payment challenge");
      }
    } catch (err) {
      console.error("Buy failed:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
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
          <span className="font-bold text-sr-text">{pricePerToken} CSPR</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-sr-text-secondary">Available</span>
          <span className="text-sr-text">{available.toLocaleString()} tokens</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm text-sr-text-secondary">Quantity</label>
        <input
          type="number"
          min={1}
          max={available}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="flex items-center justify-center gap-2 rounded-full bg-sr-green/20 py-3 text-sr-green">
          <CheckCircle size={16} />
          <span className="font-bold">Purchase Successful!</span>
        </div>
      ) : (
        <button
          onClick={handleBuy}
          disabled={!isConnected || loading || available < quantity}
          className="btn-pill flex w-full items-center justify-center gap-2 bg-sr-green text-black hover:bg-sr-green/80 disabled:opacity-50"
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
