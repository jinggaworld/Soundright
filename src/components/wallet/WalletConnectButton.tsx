"use client";

import { useState } from "react";
import { useWallet } from "./WalletProvider";
import { shortenAddress, explorerUrl } from "@/lib/casper";
import { Wallet, LogOut, ExternalLink, RefreshCw } from "lucide-react";

export function WalletConnectButton() {
  const { isConnected, address, balance, isConnecting, connect, disconnect, switchAccount } =
    useWallet();
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && address) {
    return (
      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 rounded-full bg-sr-mid px-4 py-2 text-sm text-sr-text hover:bg-sr-card transition-colors"
        >
          <span className="font-bold text-sr-green">
            {balance?.toFixed(2) ?? "0"} CSPR
          </span>
          <span className="text-sr-text-secondary">
            {shortenAddress(address)}
          </span>
          <ExternalLink size={12} className="text-sr-text-secondary" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-sr-border bg-sr-card shadow-xl z-50">
            <a
              href={explorerUrl("account", address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-sr-text hover:bg-sr-mid rounded-t-xl transition-colors"
            >
              <ExternalLink size={14} />
              View on Explorer
            </a>
            <button
              onClick={() => { setShowMenu(false); switchAccount(); }}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-sr-text hover:bg-sr-mid transition-colors"
            >
              <RefreshCw size={14} />
              Switch Account
            </button>
            <button
              onClick={() => { setShowMenu(false); disconnect(); }}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-sr-mid rounded-b-xl transition-colors"
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
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
