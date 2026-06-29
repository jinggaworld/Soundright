"use client";

import { useWallet } from "./WalletProvider";
import { shortenAddress, explorerUrl } from "@/lib/casper";
import { Wallet, LogOut, ExternalLink } from "lucide-react";

export function WalletConnectButton() {
  const { isConnected, address, balance, isConnecting, connect, disconnect } =
    useWallet();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={explorerUrl("account", address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full bg-sr-mid px-4 py-2 text-sm text-sr-text hover:bg-sr-card transition-colors"
        >
          <span className="font-bold text-sr-green">
            {balance?.toFixed(2) ?? "0"} CSPR
          </span>
          <span className="text-sr-text-secondary">
            {shortenAddress(address)}
          </span>
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
