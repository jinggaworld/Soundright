# Plan 19: Testing, Error Handling & Performance Optimization

## Overview
Implementasi testing strategy, error handling patterns, dan performance optimization untuk memastikan aplikasi production-ready.

## Goals
- Unit tests untuk critical paths
- API error handling middleware
- Loading states & skeleton screens
- Image optimization (Next.js Image)
- Caching strategy (ISR/SSG)
- Performance monitoring

## Tasks

### 19.1 Error Boundary (components/ErrorBoundary.tsx)
```typescript
"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] flex-col items-center justify-center bg-sr-surface rounded-lg">
            <AlertTriangle size={48} className="mb-4 text-sr-warning" />
            <h2 className="mb-2 text-xl font-bold text-sr-text">Something went wrong</h2>
            <p className="mb-4 text-sm text-sr-text-secondary">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-pill flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### 19.2 API Error Handler (lib/api-error-handler.ts)
```typescript
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Prisma errors
    if (error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { success: false, error: "Resource already exists" },
        { status: 409 }
      );
    }

    if (error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}

// Wrapper for API route handlers
export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 19.3 Skeleton Loading (components/ui/Skeleton.tsx)
```typescript
import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-sr-mid",
        {
          "h-4 rounded": variant === "text",
          "rounded-full": variant === "circular",
          "rounded-lg": variant === "rectangular",
        },
        className
      )}
    />
  );
}

export function SongCardSkeleton() {
  return (
    <div className="card-sr">
      <Skeleton variant="rectangular" className="mb-3 aspect-square w-full" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-3 h-4 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-sr">
          <Skeleton className="mb-2 h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

### 19.4 Caching Strategy (lib/cache.ts)
```typescript
// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; expiresAt: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: any, ttlMs = 60000): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Cache TTL constants
export const CACHE_TTL = {
  SONG_LIST: 5 * 60 * 1000,      // 5 minutes
  SONG_DETAIL: 2 * 60 * 1000,    // 2 minutes
  SPOTIFY_TRACK: 10 * 60 * 1000, // 10 minutes
  STATS: 60 * 1000,              // 1 minute
} as const;

// Cached fetch wrapper
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 60000
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  setCache(key, data, ttlMs);
  return data;
}
```

### 19.5 Next.js Image Optimization
```typescript
// Use Next.js Image component for all images
import Image from "next/image";

// Album art with optimization
export function AlbumArt({ src, alt, size = 200 }: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-md" style={{ width: size, height: size }}>
      <Image
        src={src || "/default-album.png"}
        alt={alt}
        fill
        className="object-cover"
        sizes={`(max-width: 768px) 100vw, ${size}px`}
      />
    </div>
  );
}
```

## Deliverables
- [ ] ErrorBoundary component
- [ ] API error handler with Prisma error mapping
- [ ] Skeleton loading components
- [ ] In-memory cache system
- [ ] Next.js Image optimization
- [ ] Error handling patterns

## Dependencies
- Plan 1 (Architecture)

## Notes
- **Error Boundaries**: Catch React errors gracefully
- **API Errors**: Consistent error response format
- **Loading States**: Skeleton screens untuk better UX
- **Caching**: Reduce API calls, improve performance
- **Images**: Next.js Image untuk optimization & lazy loading
