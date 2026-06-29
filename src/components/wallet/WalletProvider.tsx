"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getBalance } from "@/lib/casper";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  isConnecting: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signDeploy: (deploy: unknown) => Promise<unknown>;
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

  const isCsprClickAvailable =
    typeof window !== "undefined" && !!(window as any).csprclick;

  const connect = useCallback(async () => {
    if (!isCsprClickAvailable) {
      alert("Please install CSPR.click wallet extension");
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
      const csprclick = (window as any).csprclick;
      const result = await csprclick.connect();

      const bal = await getBalance(result.publicKey);

      setState({
        isConnected: true,
        address: result.publicKey,
        balance: bal,
        isConnecting: false,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setState((prev) => ({ ...prev, isConnecting: false }));
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

  const signDeploy = useCallback(async (deploy: unknown) => {
    if (!state.address) throw new Error("Wallet not connected");
    const csprclick = (window as any).csprclick;
    return await csprclick.signDeploy(deploy);
  }, [state.address]);

  const refreshBalance = useCallback(async () => {
    if (!state.address) return;
    const bal = await getBalance(state.address);
    setState((prev) => ({ ...prev, balance: bal }));
  }, [state.address]);

  useEffect(() => {
    if (isCsprClickAvailable) {
      const csprclick = (window as any).csprclick;
      csprclick.isConnected().then((connected: boolean) => {
        if (connected) connect();
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{ ...state, connect, disconnect, signDeploy, refreshBalance }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
