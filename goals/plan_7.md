# Plan 7: Backend API Framework & Authentication

## Overview
Setup backend API framework dengan Next.js API Routes, authentication via CSPR.click wallet signature, dan base middleware untuk semua endpoints.

## Goals
- Setup Next.js API route structure
- Implement wallet-based authentication (sign message)
- Create API middleware for auth, error handling, rate limiting
- Setup response format standardization
- Database connection middleware

## Tasks

### 7.1 API Response Helper (lib/api-response.ts)
```typescript
import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } as ApiResponse<T>, { status });
}

export function errorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error } as ApiResponse, { status });
}

export function notFoundResponse(resource = "Resource"): NextResponse {
  return errorResponse(`${resource} not found`, 404);
}

export function unauthorizedResponse(message = "Unauthorized"): NextResponse {
  return errorResponse(message, 401);
}
```

### 7.2 Auth System (app/api/auth/)
```
app/api/auth/
├── connect/route.ts       → Verify wallet signature, create/update user
├── me/route.ts            → Get current authenticated user
└── logout/route.ts        → Clear session
```

### 7.3 Connect Endpoint (app/api/auth/connect/route.ts)
```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { address, signature, message } = await req.json();

    if (!address || !signature || !message) {
      return errorResponse("Missing required fields: address, signature, message");
    }

    // Verify the message was signed by this address
    // CSPR.click signature verification
    // For now, we trust the wallet extension's signature
    const expectedMessage = `Sign this message to authenticate with SoundRight.\n\nWallet: ${address}\nTimestamp: ${message.split("Timestamp: ")[1]}`;

    // Check if artist or investor exists
    let user = await prisma.artist.findUnique({ where: { walletAddress: address } });
    let userType = "artist";

    if (!user) {
      user = await prisma.artist.create({
        data: {
          name: `Artist ${address.slice(0, 8)}`,
          email: `${address.slice(0, 8)}@soundright.app`,
          walletAddress: address,
        },
      });
    }

    // Create session token (simple JWT-like approach)
    const sessionToken = crypto.createHash("sha256")
      .update(`${address}-${Date.now()}-${process.env.NEXTAUTH_SECRET}`)
      .digest("hex");

    // Store session (in production, use Redis or DB)
    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        type: userType,
      },
      sessionToken,
    });

    // Set session cookie
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Auth connect error:", error);
    return errorResponse("Authentication failed", 500);
  }
}
```

### 7.4 Middleware (lib/middleware.ts)
```typescript
import { NextRequest } from "next/server";

export function getClientAddress(req: NextRequest): string | null {
  // Extract wallet address from session or header
  const session = req.cookies.get("session")?.value;
  if (!session) return null;

  // In production, validate session against DB
  // For now, extract from header if present
  return req.headers.get("x-wallet-address");
}

export function validateRequiredFields(body: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

export function paginateQuery(page: number, limit: number) {
  const offset = (page - 1) * limit;
  return { skip: offset, take: limit };
}
```

### 7.5 Rate Limiter (lib/rate-limit.ts)
```typescript
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}
```

## Deliverables
- [ ] API response helpers
- [ ] Wallet-based authentication system
- [ ] API middleware (auth, validation, rate limiting)
- [ ] Session management
- [ ] Prisma database client

## Dependencies
- Plan 1 (Project Architecture)
- Plan 2 (Casper Integration)
- PostgreSQL database

## Notes
- **Auth Flow**: User sign message dengan CSPR.click → Backend verify → Create session
- **No Passwords**: Authentication sepenuhnya via wallet signature
- **Session**: Simple hash-based session, production gunakan Redis
- **Rate Limiting**: In-memory rate limiter, production gunakan Redis
