/**
 * Server-side initialization: force IPv4 DNS resolution.
 * This fixes ETIMEDOUT errors on networks where IPv6 is broken/unreachable.
 * Must be imported by server-side code (API routes, middleware, etc.).
 */
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
