"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { getBalance } from "@/lib/casper";

/* ─── Types ─────────────────────────────────────────── */

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  isConnecting: boolean;
  sdkReady: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  signDeploy: (deploy: unknown) => Promise<unknown>;
  signPayment: (args: {
    recipient: string;
    amount: number;
    nonce: string;
    deadline: string;
  }) => Promise<unknown>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/* ─── Casper Wallet Provider Helper ─────────────────── */

function getCasperWalletProvider(): any {
  if (typeof window === "undefined") return null;
  // Casper Wallet extension injects window.CasperWalletProvider
  const ProviderConstructor = (window as any).CasperWalletProvider;
  if (typeof ProviderConstructor !== "function") return null;
  return ProviderConstructor({ timeout: 30 * 60 * 1000 });
}

/* ─── Provider ──────────────────────────────────────── */

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isConnecting: false,
    sdkReady: false,
  });

  const providerRef = useRef<any>(null);

  // Detect Casper Wallet extension availability
  useEffect(() => {
    const checkWallet = () => {
      const provider = getCasperWalletProvider();
      if (provider) {
        providerRef.current = provider;
        setState((prev) => ({ ...prev, sdkReady: true }));
        console.log("Casper Wallet extension detected");

        // Check if already connected
        provider
          .isConnected()
          .then((connected: boolean) => {
            if (connected) {
              return provider.getActivePublicKey();
            }
            return null;
          })
          .then((publicKey: string | null) => {
            if (publicKey) {
              return getBalance(publicKey).then((bal) => ({
                publicKey,
                bal,
              }));
            }
            return null;
          })
          .then(
            (result: { publicKey: string; bal: number } | null) => {
              if (result) {
                setState((prev) => ({
                  ...prev,
                  isConnected: true,
                  address: result.publicKey,
                  balance: result.bal,
                }));
              }
            }
          )
          .catch(() => {});
      } else {
        // Retry after a short delay (extension might not be loaded yet)
        setTimeout(checkWallet, 500);
      }
    };

    checkWallet();
  }, []);

  /* ─── Connect ───────────────────────────────────── */

  const connect = useCallback(async () => {
    const provider = providerRef.current || getCasperWalletProvider();
    if (!provider) {
      alert(
        "Casper Wallet extension not detected!\n\nPlease install it from:\nhttps://chrome.google.com/webstore/detail/casper-wallet"
      );
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
      const connected = await provider.requestConnection();
      if (connected) {
        const publicKey = await provider.getActivePublicKey();
        const bal = await getBalance(publicKey);
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address: publicKey,
          balance: bal,
          isConnecting: false,
        }));
      } else {
        setState((prev) => ({ ...prev, isConnecting: false }));
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, []);

  /* ─── Disconnect ────────────────────────────────── */

  const disconnect = useCallback(async () => {
    setState((prev) => ({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      sdkReady: prev.sdkReady,
    }));
  }, []);

  /* ─── Sign Deploy ──────────────────────────────── */

  const signDeploy = useCallback(
    async (deploy: unknown) => {
      const provider = providerRef.current;
      if (!state.address) throw new Error("Wallet not connected");
      if (!provider) throw new Error("Casper Wallet not available");

      const deployJson =
        typeof deploy === "string" ? deploy : JSON.stringify(deploy);
      const result = await provider.sign(deployJson, state.address);
      return result;
    },
    [state.address]
  );

  /* ─── Sign Payment ─────────────────────────────── */

  const signPayment = useCallback(
    async (args: {
      recipient: string;
      amount: number;
      nonce: string;
      deadline: string;
    }) => {
      const provider = providerRef.current;
      if (!state.address) throw new Error("Wallet not connected");
      if (!provider) throw new Error("Casper Wallet not available");

      const deploy = {
        payment: { amount: args.amount },
        session: { tag: "transfer" },
        body: {
          args: [
            { name: "amount", value: args.amount },
            { name: "target", value: args.recipient },
          ],
        },
      };
      const deployJson = JSON.stringify(deploy);
      return await provider.sign(deployJson, state.address);
    },
    [state.address]
  );

  /* ─── Refresh Balance ──────────────────────────── */

  const refreshBalance = useCallback(async () => {
    if (!state.address) return;
    const bal = await getBalance(state.address);
    setState((prev) => ({ ...prev, balance: bal }));
  }, [state.address]);

  /* ─── Render ───────────────────────────────────── */

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        signDeploy,
        signPayment,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────────── */

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
