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

/* ─── CSPR.click SDK Config ─────────────────────────── */

const CSPRCLICK_APP_NAME =
  process.env.NEXT_PUBLIC_CSPRCLICK_APP_NAME || "Soundright";
const CSPRCLICK_SDK_URL =
  "https://cdn.cspr.click/ui/v2.1.0/csprclick-client-2.1.0.js";
const PRODUCTION_APP_ID =
  process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID || "2058ce6f-44f5-44c4-8eb5-80bc327f";

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

  useEffect(() => {
    let cancelled = false;

    // Use csprclick-template for localhost dev (no domain registration needed)
    // Use custom appId for production (registered at console.cspr.build)
    const isDev = window.location.hostname === "localhost";
    const appId = isDev ? "csprclick-template" : PRODUCTION_APP_ID;

    // Set SDK options BEFORE loading the script
    (window as any).clickSDKOptions = {
      appId,
      appName: CSPRCLICK_APP_NAME,
      contentMode: "popup",
      providers: [
        "casper-wallet",
        "ledger",
        "metamask-snap",
        "csprclick-w3a-google",
        "walletconnect",
      ],
      jwt: false,
      casperNode: "https://rpc.testnet.casperlabs.io",
      chainName: "casper-test",
      logLevel: 3,
    };

    (window as any).clickUIOptions = {
      uiContainer: "csprclick-ui",
    };

    function onSdkReady() {
      if (cancelled) return;
      const csprclick = (window as any).csprclick;
      if (!csprclick) {
        console.warn(
          "csprclick:loaded fired but window.csprclick is still null"
        );
        return;
      }

      console.log("CSPR.click SDK ready (appId:", appId + ")");
      sdkRef.current = csprclick;
      setState((prev) => ({ ...prev, sdkReady: true }));

      // Listen for account events
      csprclick.on?.("csprclick:signed_in", async (account: any) => {
        console.log("CSPR.click: signed in", account);
        if (account?.publicKey && !cancelled) {
          const bal = await getBalance(account.publicKey);
          setState((prev) => ({
            ...prev,
            isConnected: true,
            address: account.publicKey,
            balance: bal,
          }));
        }
      });

      csprclick.on?.("csprclick:switched_account", async (account: any) => {
        if (account?.publicKey && !cancelled) {
          const bal = await getBalance(account.publicKey);
          setState((prev) => ({
            ...prev,
            address: account.publicKey,
            balance: bal,
          }));
        }
      });

      csprclick.on?.("csprclick:signed_out", () => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          address: null,
          balance: null,
        }));
      });

      // Check if already connected
      csprclick
        .getActiveAccountAsync?.({ withBalance: true })
        .then((account: any) => {
          if (account?.publicKey && !cancelled) {
            const bal =
              typeof account.liquid_balance === "string"
                ? parseFloat(account.liquid_balance)
                : Number(account.liquid_balance) || 0;
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: account.publicKey,
              balance: bal,
            }));
          }
        })
        .catch(() => {});
    }

    // Listen for the csprclick:loaded event (SDK fires this when ready)
    window.addEventListener("csprclick:loaded", onSdkReady);

    // Also check if already available (script loaded before mount)
    if ((window as any).csprclick) {
      onSdkReady();
    }

    // Load the CDN script
    if (!document.getElementById("csprclick-client")) {
      const script = document.createElement("script");
      script.id = "csprclick-client";
      script.src = CSPRCLICK_SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    } else if ((window as any).csprclick) {
      onSdkReady();
    }

    return () => {
      cancelled = true;
      window.removeEventListener("csprclick:loaded", onSdkReady);
    };
  }, []);

  /* ─── Connect ───────────────────────────────────── */

  const connect = useCallback(async () => {
    const csprclick = sdkRef.current || (window as any).csprclick;
    if (!csprclick) {
      alert(
        "CSPR.click wallet selector is loading. Please wait and try again."
      );
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
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
        csprclick.signOut?.();
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
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
      const csprclick = sdkRef.current || (window as any).csprclick;
      if (!state.address) throw new Error("Wallet not connected");
      if (!csprclick?.sign) throw new Error("CSPR.click SDK not ready");
      const signingKey =
        csprclick.getActiveAccount?.()?.publicKey || state.address;
      return await csprclick.sign(deploy, signingKey);
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
      <div id="csprclick-ui" />
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
