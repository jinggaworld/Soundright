import { NextRequest } from "next/server";

/**
 * Extract wallet address from session cookie or x-wallet-address header.
 * Returns null if no session exists.
 */
export function getClientAddress(req: NextRequest): string | null {
  const session = req.cookies.get("session")?.value;
  if (!session) return null;

  // In production, validate session against DB/Redis
  // For now, extract from header if present
  return req.headers.get("x-wallet-address");
}

/**
 * Validate that all required fields are present in the request body.
 * Returns an error message string if a field is missing, or null if valid.
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === "") {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Calculate Prisma skip/take pagination params from page number and limit.
 */
export function paginateQuery(page: number, limit: number) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const offset = (safePage - 1) * safeLimit;
  return { skip: offset, take: safeLimit };
}

/**
 * Extract session token from request cookies.
 */
export function getSessionToken(req: NextRequest): string | null {
  return req.cookies.get("session")?.value ?? null;
}
