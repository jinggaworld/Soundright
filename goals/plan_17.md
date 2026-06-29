# Plan 17: Shared UI Components Library

## Overview
Implementasi library komponen UI yang reusable mengikuti design system Spotify-inspired dari design.md. Semua komponen dark theme, pill buttons, heavy shadows.

## Goals
- Base UI components (Button, Input, Card, Badge, Modal)
- Layout components (Sidebar, Header, Footer)
- Shared utility components
- Consistent design tokens
- Responsive behavior

## Tasks

### 17.1 Base Components

#### Button Component (components/ui/Button.tsx)
```typescript
import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all",
          "rounded-full",
          {
            "bg-sr-green text-black hover:bg-sr-green-dark hover:scale-105": variant === "primary",
            "bg-sr-mid text-sr-text hover:bg-sr-card": variant === "secondary",
            "bg-transparent border border-sr-border-light text-sr-text hover:bg-sr-mid": variant === "outline",
            "bg-transparent text-sr-text hover:bg-sr-mid": variant === "ghost",
          },
          {
            "px-4 py-2 text-xs": size === "sm",
            "px-8 py-3 text-sm": size === "md",
            "px-12 py-4 text-base": size === "lg",
          },
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        style={{ letterSpacing: "1.4px" }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
```

#### Input Component (components/ui/Input.tsx)
```typescript
import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1 block text-sm font-bold text-sr-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full rounded-full bg-sr-mid px-4 py-3 text-sr-text",
            "shadow-[rgb(18,18,18)_0px_1px_0px,rgb(124,124,124)_0px_0px_0px_1px_inset]",
            "focus:outline-none focus:shadow-[rgb(18,18,18)_0px_1px_0px,rgb(0,0,0)_0px_0px_0px_1px_inset]",
            "placeholder:text-sr-text-secondary",
            error && "shadow-[rgb(18,18,18)_0px_1px_0px,rgb(243,114,127)_0px_0px_0px_1px_inset]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-sr-negative">{error}</p>}
      </div>
    );
  }
);
```

#### Card Component (components/ui/Card.tsx)
```typescript
import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = true, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "rounded-lg bg-sr-surface p-4",
          hover && "transition-shadow hover:shadow-[rgba(0,0,0,0.3)_0px_8px_8px]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
```

#### Badge Component (components/ui/Badge.tsx)
```typescript
import { clsx } from "clsx";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error" | "info";
  children: React.ReactNode;
}

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
        {
          "bg-sr-mid text-sr-text-secondary": variant === "default",
          "bg-sr-green/20 text-sr-green": variant === "success",
          "bg-sr-warning/20 text-sr-warning": variant === "warning",
          "bg-sr-negative/20 text-sr-negative": variant === "error",
          "bg-sr-announcement/20 text-sr-announcement": variant === "info",
        }
      )}
    >
      {children}
    </span>
  );
}
```

### 17.2 Layout Components

#### Sidebar (components/layout/Sidebar.tsx)
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Music, TrendingUp, Settings, Wallet } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

const navItems = [
  { href: "/", icon: <Home size={20} />, label: "Home" },
  { href: "/marketplace", icon: <Search size={20} />, label: "Marketplace" },
  { href: "/artist/dashboard", icon: <Music size={20} />, label: "Artist" },
  { href: "/investor/dashboard", icon: <TrendingUp size={20} />, label: "Investor" },
  { href: "/admin", icon: <Settings size={20} />, label: "Admin" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 flex h-full w-60 flex-col bg-sr-black p-4">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sr-green text-black font-bold">
          SR
        </div>
        <span className="text-xl font-bold text-sr-text">SoundRight</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sr-mid font-bold text-sr-text"
                  : "font-normal text-sr-text-secondary hover:text-sr-text"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="border-t border-sr-border pt-4">
        <WalletConnectButton />
      </div>
    </aside>
  );
}
```

#### Header (components/layout/Header.tsx)
```typescript
"use client";

import { Search } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-sr-black/80 px-6 py-4 backdrop-blur-md">
      <div className="flex-1" />

      {/* Search */}
      <div className="relative mx-4 max-w-md flex-1">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sr-text-secondary" />
        <input
          type="text"
          placeholder="What do you want to play?"
          className="w-full rounded-full bg-sr-mid py-2 pl-10 pr-4 text-sm text-sr-text placeholder:text-sr-text-secondary shadow-[rgb(18,18,18)_0px_1px_0px,rgb(124,124,124)_0px_0px_0px_1px_inset] focus:outline-none"
        />
      </div>

      <div className="flex-1 flex justify-end">
        <WalletConnectButton />
      </div>
    </header>
  );
}
```

### 17.3 Shared Utility Components

#### DistributionCountdown (components/shared/DistributionCountdown.tsx)
```typescript
"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface Props {
  days: number;
}

export function DistributionCountdown({ days }: Props) {
  return (
    <div className="card-sr flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sr-green/20">
        <Clock size={24} className="text-sr-green" />
      </div>
      <div>
        <p className="text-sm text-sr-text-secondary">Next Distribution</p>
        <p className="text-2xl font-bold text-sr-text">
          {days} {days === 1 ? "day" : "days"}
        </p>
      </div>
    </div>
  );
}
```

#### YieldBadge (components/shared/YieldBadge.tsx)
```typescript
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Props {
  yield: number;
  trend?: "up" | "down" | "stable";
}

export function YieldBadge({ yield: yieldValue, trend }: Props) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color = trend === "up" ? "text-sr-green" : trend === "down" ? "text-sr-negative" : "text-sr-text-secondary";

  return (
    <span className={`inline-flex items-center gap-1 text-sm font-bold ${color}`}>
      <TrendIcon size={14} />
      {yieldValue.toFixed(1)}%
    </span>
  );
}
```

## Deliverables
- [ ] Button component with variants
- [ ] Input component with labels/errors
- [ ] Card component with hover
- [ ] Badge component with variants
- [ ] Sidebar navigation
- [ ] Header with search
- [ ] DistributionCountdown
- [ ] YieldBadge

## Dependencies
- Plan 1 (Architecture - Tailwind config)

## Notes
- **Design System**: Mengikuti design.md Spotify-inspired
- **Dark Theme**: #121212 background, #1ed760 accent
- **Pill Buttons**: 9999px radius untuk semua buttons
- **Heavy Shadows**: Untuk elevated elements
- **Responsive**: Mobile-first approach
