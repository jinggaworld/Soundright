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

/* ─── CSPR.click SDK Loader ─────────────────────────── */

const CSPRCLICK_APP_ID = "2058ce6f-44f5-44c4-8eb5-80bc327f";
const CSPRCLICK_APP_NAME = "Soundright";
const CSPRCLICK_SDK_URL =
  "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";

function loadCsprClickScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser environment"));
      return;
    }

    // Already loaded
    if ((window as any).csprclick) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existing = document.getElementById("csprclick-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load CSPR.click SDK from CDN"))
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "csprclick-sdk";
    script.src = CSPRCLICK_SDK_URL;
    script.async = true;

    script.onload = () => {
      // Wait a tick for SDK to initialize on window
      setTimeout(resolve, 200);
    };
    script.onerror = () =>
      reject(new Error("Failed to load CSPR.click SDK from CDN"));

    document.head.appendChild(script);
  });
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

  const sdkRef = useRef<any>(null);

  // Load CSPR.click SDK script and initialize
  useEffect(() => {
    let cancelled = false;

    async function initSdk() {
      try {
        await loadCsprClickScript();

        if (cancelled) return;

        const csprclick = (window as any).csprclick;
        if (!csprclick) {
          console.error("CSPR.click SDK not found on window after script load");
          return;
        }

        // Initialize SDK with app config
        try {
          csprclick.init({
            appName: CSPRCLICK_APP_NAME,
            appId: CSPRCLICK_APP_ID,
            contentMode: "popup",
            providers: [
              "casper-wallet",
              "ledger",
              "metamask-snap",
              "csprclick-w3a-google",
              "walletconnect",
            ],
            jwt: false,
            logLevel: 3,
          });
        } catch (e) {
          // init() may have already been called
          console.log("CSPR.click init:", e);
        }

        sdkRef.current = csprclick;
        setState((prev) => ({ ...prev, sdkReady: true }));

        // Listen for account events
        csprclick.on?.("csprclick:signed_in", async (account: any) => {
          console.log("CSPR.click: signed in", account);
          if (account?.publicKey) {
            const bal = await getBalance(account.publicKey);
            if (!cancelled) {
              setState((prev) => ({
                ...prev,
                isConnected: true,
                address: account.publicKey,
                balance: bal,
              }));
            }
          }
        });

        csprclick.on?.("csprclick:switched_account", async (account: any) => {
          console.log("CSPR.click: switched account", account);
          if (account?.publicKey) {
            const bal = await getBalance(account.publicKey);
            if (!cancelled) {
              setState((prev) => ({
                ...prev,
                address: account.publicKey,
                balance: bal,
              }));
            }
          }
        });

        csprclick.on?.("csprclick:signed_out", () => {
          console.log("CSPR.click: signed out");
          setState((prev) => ({
            ...prev,
            isConnected: false,
            address: null,
            balance: null,
          }));
        });

        // Check if already connected
        const activeAccount = csprclick.getActiveAccount?.();
        if (activeAccount?.publicKey) {
          const bal = await getBalance(activeAccount.publicKey);
          if (!cancelled) {
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: activeAccount.publicKey,
              balance: bal,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load/init CSPR.click SDK:", error);
      }
    }

    initSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── Connect ───────────────────────────────────── */

  const connect = useCallback(async () => {
    const csprclick = sdkRef.current || (window as any).csprclick;
    if (!csprclick) {
      alert(
        "CSPR.click wallet selector is loading.\n\nPlease wait a moment and try again."
      );
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
      // signIn() opens the wallet selector modal
      const account = await csprclick.signIn();

      if (account?.publicKey) {
        const bal = await getBalance(account.publicKey);
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address: account.publicKey,
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
    const csprclick = sdkRef.current || (window as any).csprclick;
    try {
      if (csprclick) {
        const account = csprclick.getActiveAccount?.();
        if (account) {
          await csprclick.disconnect?.("casper-wallet");
        }
        csprclick.signOut?.();
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }

    setState({
      isConnected: false,
      address: null,
      balance: null,
      isConnecting: false,
      sdkReady: state.sdkReady,
    });
  }, [state.sdkReady]);

  /* ─── Sign Deploy ──────────────────────────────── */

  const signDeploy = useCallback(
    async (deploy: unknown) => {
      const csprclick = sdkRef.current || (window as any).csprclick;
      if (!state.address) throw new Error("Wallet not connected");
      if (!csprclick?.sign) throw new Error("CSPR.click SDK not ready");

      const signingKey =
        csprclick.getActiveAccount?.()?.publicKey || state.address;
      const result = await csprclick.sign(deploy, signingKey);
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
      const csprclick = sdkRef.current || (window as any).csprclick;
      if (!state.address) throw new Error("Wallet not connected");
      if (!csprclick?.sign) throw new Error("CSPR.click SDK not ready");

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

      const signingKey =
        csprclick.getActiveAccount?.()?.publicKey || state.address;
      return await csprclick.sign(deploy, signingKey);
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
