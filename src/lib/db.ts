import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Get the Prisma client instance. Lazy-initialized to avoid build-time failures
 * when DATABASE_URL is not available.
 *
 * Prisma 7 requires a driver adapter (PrismaPg) — no more built-in query engine.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }
    const adapter = new PrismaPg({ connectionString });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

// Default export — lazy proxy that defers PrismaClient creation until first use
const handler: ProxyHandler<object> = {
  get(_target, prop, receiver) {
    if (prop === Symbol.toPrimitive || prop === "then" || prop === "catch") {
      return undefined;
    }
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
};

export const prisma = new Proxy({}, handler) as PrismaClient;

export default prisma;
