/**
 * Server-side initialization: force IPv4 for ALL fetch requests.
 *
 * Problem: Node.js fetch tries IPv6 first → ETIMEDOUT on user's network.
 * casper-js-sdk uses global fetch, so overriding it fixes all RPC calls.
 *
 * Solution: Override globalThis.fetch with undici's fetch using an Agent
 * configured with family: 4 (IPv4 sockets only).
 *
 * Must be imported by every server-side file that makes HTTP requests.
 */
import { Agent, fetch as undiciFetch } from "undici";

const ipv4Agent = new Agent({
  connect: {
    family: 4,
  },
});

globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return undiciFetch(input as any, {
    ...init,
    dispatcher: ipv4Agent,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any;
}) as typeof fetch;
