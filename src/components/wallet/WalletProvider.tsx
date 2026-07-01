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

/**
 * Load the CSPR.click SDK from CDN.
 *
 * IMPORTANT: The SDK requires `window.clickSDKOptions` and `window.clickUIOptions`
 * to be set BEFORE the script loads. The script reads these options and creates
 * `window.csprclick` (core SDK) and `window.csprclickUI` (UI component).
 */
function loadCsprClickScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser environment"));
      return;
    }

    // Already loaded and initialized
    if ((window as any).csprclick) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existing = document.getElementById("csprclick-client");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load CSPR.click SDK from CDN"))
      );
      return;
    }

    // ── Set SDK options BEFORE loading the script ──
    // The CDN script reads these globals to configure itself
    (window as any).clickSDKOptions = {
      appId: CSPRCLICK_APP_ID,
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
      uiContainer: undefined, // Let the SDK create its own container
    };

    const script = document.createElement("script");
    script.id = "csprclick-client";
    script.src = CSPRCLICK_SDK_URL;
    script.async = true;

    script.onload = () => {
      // The script creates window.csprclick asynchronously.
      // Poll briefly for it to appear.
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds
      const checkInterval = setInterval(() => {
        if ((window as any).csprclick) {
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          // csprclickUI might be available even if csprclick is not yet
          if ((window as any).csprclickUI) {
            resolve();
          } else {
            reject(
              new Error(
                "CSPR.click SDK loaded but window.csprclick not found"
              )
            );
          }
        }
        attempts++;
      }, 100);
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

        // Try window.csprclick first, then window.csprclickUI
        const csprclick =
          (window as any).csprclick || (window as any).csprclickUI;
        if (!csprclick) {
          console.error("CSPR.click SDK not found on window after script load");
          return;
        }

        // Initialize SDK if not already initialized by the CDN script
        if (typeof csprclick.init === "function") {
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
            // init() may have already been called by the CDN script
            console.log("CSPR.click init (may already be initialized):", e);
          }
        }

        sdkRef.current = csprclick;
        setState((prev) => ({ ...prev, sdkReady: true }));
        console.log("CSPR.click SDK ready:", csprclick);

        // Listen for account events (if the SDK supports it)
        if (typeof csprclick.on === "function") {
          csprclick.on("csprclick:signed_in", async (account: any) => {
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

          csprclick.on(
            "csprclick:switched_account",
            async (account: any) => {
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
            }
          );

          csprclick.on("csprclick:signed_out", () => {
            console.log("CSPR.click: signed out");
            setState((prev) => ({
              ...prev,
              isConnected: false,
              address: null,
              balance: null,
            }));
          });
        }

        // Check if already connected
        const getActiveAccount =
          csprclick.getActiveAccount || csprclick.getActiveAccountAsync;
        if (getActiveAccount) {
          const activeAccount = await getActiveAccount.call(csprclick);
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
    const csprclick =
      sdkRef.current ||
      (window as any).csprclick ||
      (window as any).csprclickUI;
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
    const csprclick =
      sdkRef.current ||
      (window as any).csprclick ||
      (window as any).csprclickUI;
    try {
      if (csprclick) {
        const activeAccount = csprclick.getActiveAccount?.();
        if (activeAccount) {
          await csprclick.disconnect?.("casper-wallet");
        }
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
      const csprclick =
        sdkRef.current ||
        (window as any).csprclick ||
        (window as any).csprclickUI;
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
      const csprclick =
        sdkRef.current ||
        (window as any).csprclick ||
        (window as any).csprclickUI;
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
