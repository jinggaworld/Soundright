# Plan 2: Casper Network Integration & Wallet Connection

## Overview
Setup integrasi Casper Network SDK, CSPR.click wallet connection, dan base utilities untuk berinteraksi dengan blockchain.

## Goals
- Setup Casper JS SDK client
- Integrasikan CSPR.click wallet (connect, sign, verify)
- Buat Casper utility functions (balance check, deploy, tx)
- Setup CSPR Explorer link generator
- Wallet state management (React Context)

## Tasks

### 2.1 Casper SDK Client (lib/casper.ts)
```typescript
import { CasperClient, RPCClient } from "casper-js-sdk";

const RPC_URL = process.env.CASPER_RPC_URL || "https://rpc.testnet.casperlabs.io";

export const casperClient = new CasperClient(RPC_URL);
export const rpcClient = new RPCClient(RPC_URL);

// Utility: get account balance in CSPR
export async function getBalance(address: string): Promise<number> {
  const balanceUref = await rpcClient.getAccountBalance(address);
  if (!balanceUref) return 0;
  // Convert motes to CSPR (1 CSPR = 10^9 motes)
  return Number(balanceUref) / 1_000_000_000;
}

// Utility: generate Casper Explorer URL
export function explorerUrl(type: "tx" | "account" | "contract", identifier: string): string {
  const base = "https://cspr.cloud";
  switch (type) {
    case "tx": return `${base}/deploy/${identifier}`;
    case "account": return `${base}/account/${identifier}`;
    case "contract": return `${base}/contract/${identifier}`;
  }
}

// Utility: shorten Casper address for display
export function shortenAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Utility: CSPR to motes
export function csprToMotes(cspr: number): bigint {
  return BigInt(Math.round(cspr * 1_000_000_000));
}

// Utility: motes to CSPR
export function motesToCspr(motes: bigint): number {
  return Number(motes) / 1_000_000_000;
}
```

### 2.2 CSPR.click Wallet Integration (components/wallet/WalletProvider.tsx)
```typescript
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  isConnecting: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signDeploy: (deploy: any) => Promise<any>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
  });

  // Check if CSPR.click is available
  const isCsprClickAvailable = typeof window !== "undefined" && (window as any).csprclick;

  const connect = useCallback(async () => {
    if (!isCsprClickAvailable) {
      alert("Please install CSPR.click wallet extension");
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      const csprclick = (window as any).csprclick;
      const result = await csprclick.connect();

      setState({
        isConnected: true,
        address: result.publicKey,
        balance: null,
        isConnecting: false,
      });

      // Fetch balance
      const bal = await getBalance(result.publicKey);
      setState(prev => ({ ...prev, balance: bal }));
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [isCsprClickAvailable]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
    });
  }, []);

  const signDeploy = useCallback(async (deploy: any) => {
    if (!state.address) throw new Error("Wallet not connected");
    const csprclick = (window as any).csprclick;
    return await csprclick.signDeploy(deploy);
  }, [state.address]);

  const refreshBalance = useCallback(async () => {
    if (!state.address) return;
    const bal = await getBalance(state.address);
    setState(prev => ({ ...prev, balance: bal }));
  }, [state.address]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (isCsprClickAvailable) {
      const csprclick = (window as any).csprclick;
      csprclick.isConnected().then((connected: boolean) => {
        if (connected) connect();
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, signDeploy, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
```

### 2.3 Wallet Connect Button (components/wallet/WalletConnectButton.tsx)
```typescript
"use client";

import { useWallet } from "./WalletProvider";
import { shortenAddress, explorerUrl } from "@/lib/casper";
import { Wallet, LogOut, ExternalLink } from "lucide-react";

export function WalletConnectButton() {
  const { isConnected, address, balance, isConnecting, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={explorerUrl("account", address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-sr-mid px-4 py-2 text-sm text-sr-text hover:bg-sr-card transition-colors"
        >
          <span className="font-bold text-sr-green">{balance?.toFixed(2) ?? "0"} CSPR</span>
          <span className="text-sr-text-secondary">{shortenAddress(address)}</span>
          <ExternalLink size={12} className="text-sr-text-secondary" />
        </a>
        <button
          onClick={disconnect}
          className="rounded-full p-2 text-sr-text-secondary hover:text-sr-text hover:bg-sr-mid transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="btn-pill flex items-center gap-2 text-sm"
    >
      <Wallet size={16} />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
```

### 2.4 Transaction Toast (components/shared/TransactionToast.tsx)
```typescript
"use client";

import { useEffect, useState } from "react";
import { explorerUrl } from "@/lib/casper";
import { ExternalLink, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface TxToastProps {
  txHash: string | null;
  status: "pending" | "success" | "error";
  message?: string;
  onClose: () => void;
}

export function TransactionToast({ txHash, status, message, onClose }: TxToastProps) {
  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(onClose, 8000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const icons = {
    pending: <Loader2 size={16} className="animate-spin text-sr-announcement" />,
    success: <CheckCircle size={16} className="text-sr-green" />,
    error: <XCircle size={16} className="text-sr-negative" />,
  };

  const labels = {
    pending: "Transaction Pending",
    success: "Transaction Confirmed",
    error: "Transaction Failed",
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-lg bg-sr-surface px-4 py-3 shadow-heavy animate-slide-up">
      {icons[status]}
      <div>
        <p className="text-sm font-bold text-sr-text">{labels[status]}</p>
        {message && <p className="text-xs text-sr-text-secondary">{message}</p>}
      </div>
      {txHash && (
        <a
          href={explorerUrl("tx", txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-sr-green hover:underline"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
```

### 2.5 Casper Explorer Link Component (components/shared/CasperExplorerLink.tsx)
```typescript
import { explorerUrl } from "@/lib/casper";
import { ExternalLink } from "lucide-react";

interface Props {
  type: "tx" | "account" | "contract";
  address: string;
  label?: string;
}

export function CasperExplorerLink({ type, address, label }: Props) {
  return (
    <a
      href={explorerUrl(type, address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-sr-announcement hover:underline"
    >
      {label || `${address.slice(0, 8)}...${address.slice(-4)}`}
      <ExternalLink size={10} />
    </a>
  );
}
```

### 2.6 x402 Payment Utility (lib/x402.ts)
```typescript
// x402 payment flow untuk beli token
export async function buyTokensX402(
  songContractAddress: string,
  tokenAmount: number,
  pricePerTokenCSPR: number,
  buyerAddress: string
) {
  const totalCSPR = tokenAmount * pricePerTokenCSPR;

  // Step 1: Request payment challenge dari backend
  const challengeResponse = await fetch("/api/tokens/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ songContractAddress, tokenAmount, buyerAddress }),
  });

  if (challengeResponse.status === 402) {
    const { price, recipient, nonce, deadline } = await challengeResponse.json();

    // Step 2: Sign payment authorization (via CSPR.click wallet)
    const paymentProof = await (window as any).csprclick.signPayment({
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
      body: JSON.stringify({ songContractAddress, tokenAmount, buyerAddress }),
    });

    return finalResponse.json();
  }

  throw new Error("Payment failed");
}

// Distribusi royalti ke semua holders pakai x402 batch payment
export async function distributeRoyaltiesX402(
  holders: string[],
  amounts: bigint[],
  songId: string
) {
  const response = await fetch("/api/royalties/distribute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ holders, amounts: amounts.map(a => a.toString()), songId }),
  });

  return response.json();
}
```

## Deliverables
- [ ] Casper SDK client with utility functions
- [ ] CSPR.click wallet integration (connect/disconnect/sign)
- [ ] WalletConnectButton component
- [ ] TransactionToast notification component
- [ ] CasperExplorerLink component
- [ ] x402 payment utility functions
- [ ] WalletProvider React Context

## Dependencies
- Plan 1 (Project Architecture)
- CSPR.click browser extension (for testing)
- Casper JS SDK installed

## Notes
- CSPR.click adalah wallet adapter yang mendukung multiple Casper wallets
- x402 adalah payment protocol untuk micropayments on Casper
- Explorer URL menggunakan cspr.cloud sebagai block explorer
