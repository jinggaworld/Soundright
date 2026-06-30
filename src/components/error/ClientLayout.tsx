"use client";

import { ErrorBoundary } from "@/components/error/ErrorBoundary";

/**
 * ClientLayout - Wraps children with ErrorBoundary for the root layout.
 * Needed because layout.tsx is a server component and ErrorBoundary must be client.
 */
export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
