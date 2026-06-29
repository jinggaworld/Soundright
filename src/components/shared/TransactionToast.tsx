"use client";

import { useEffect } from "react";
import { explorerUrl } from "@/lib/casper";
import { ExternalLink, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface TxToastProps {
  txHash: string | null;
  status: "pending" | "success" | "error";
  message?: string;
  onClose: () => void;
}

export function TransactionToast({
  txHash,
  status,
  message,
  onClose,
}: TxToastProps) {
  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(onClose, 8000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const icons = {
    pending: (
      <Loader2 size={16} className="animate-spin text-sr-announcement" />
    ),
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
        {message && (
          <p className="text-xs text-sr-text-secondary">{message}</p>
        )}
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
