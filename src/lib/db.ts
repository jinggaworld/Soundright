import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Get the Prisma client instance. Lazy-initialized to avoid build-time failures
 * when DATABASE_URL is not available.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
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
