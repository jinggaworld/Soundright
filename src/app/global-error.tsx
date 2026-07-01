"use client";

/**
 * Global error boundary — renders outside the root layout.
 * Next.js 16.2.9 has a known bug where /_global-error prerender crashes with
 * "Cannot read properties of null (reading 'useContext')". Providing an
 * explicit global-error.tsx with force-dynamic skips the problematic
 * prerender step.
 */
export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#000",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#999", marginBottom: "1.5rem" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#1DB954",
              color: "#000",
              border: "none",
              borderRadius: "9999px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
