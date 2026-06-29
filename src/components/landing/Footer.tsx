import Link from "next/link";
import { Music } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-sr-border px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Music size={18} className="text-sr-green" />
              <span className="font-bold text-sr-text">SoundRight</span>
            </div>
            <p className="text-sm text-sr-text-secondary">
              Own a piece of music. Tokenized royalties on Casper Network.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-sr-text">Platform</h4>
            <ul className="space-y-2 text-sm text-sr-text-secondary">
              <li>
                <Link href="/marketplace" className="hover:text-sr-text">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/artist/onboard" className="hover:text-sr-text">
                  For Artists
                </Link>
              </li>
              <li>
                <Link href="/investor/dashboard" className="hover:text-sr-text">
                  For Investors
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-sr-text">Resources</h4>
            <ul className="space-y-2 text-sm text-sr-text-secondary">
              <li>
                <Link href="/admin" className="hover:text-sr-text">
                  Admin
                </Link>
              </li>
              <li>
                <span className="text-sr-text-secondary">Documentation</span>
              </li>
              <li>
                <span className="text-sr-text-secondary">Smart Contracts</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-sr-text">Network</h4>
            <ul className="space-y-2 text-sm text-sr-text-secondary">
              <li>
                <span className="text-sr-text-secondary">Casper Network</span>
              </li>
              <li>
                <span className="text-sr-text-secondary">CSPR.click</span>
              </li>
              <li>
                <span className="text-sr-text-secondary">GitHub</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-sr-border pt-8 text-center text-xs text-sr-text-secondary">
          © {new Date().getFullYear()} SoundRight. All rights reserved. Built on
          Casper Network.
        </div>
      </div>
    </footer>
  );
}
