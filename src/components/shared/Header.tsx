"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Music, ShoppingCart, User, Briefcase, Shield } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/artist/dashboard", label: "Artist", icon: Music },
  { href: "/investor/dashboard", label: "Investor", icon: Briefcase },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-sr-border bg-sr-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Music size={20} className="text-sr-green" />
          <span className="text-lg font-bold text-sr-text">SoundRight</span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sr-mid text-sr-green"
                    : "text-sr-text-secondary hover:bg-sr-mid hover:text-sr-text"
                }`}
              >
                <Icon size={14} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet */}
        <WalletConnectButton />
      </div>
    </header>
  );
}
