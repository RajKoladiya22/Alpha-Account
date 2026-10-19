// Invariant 1: Subdomain Routing & Isolation Middleware

import { resolveSubdomainRoute, DEFAULT_DOMAINS } from "../config/domains.ts";
import type { SubdomainConfig } from "../config/domains.ts";

export interface MockHttpRequest {
  headers: Record<string, string | undefined>;
  url: string;
  cookies?: Record<string, string | undefined>;
}

export interface MockHttpResponse {
  status: number;
  headers: Record<string, string>;
  body?: any;
  redirectUrl?: string;
}

export function handleSubdomainRouting(
  req: MockHttpRequest,
  config: SubdomainConfig = DEFAULT_DOMAINS
): { routeType: string; rewrittenPath: string; redirect?: string; error?: string } {
  const host = req.headers["host"] || "localhost";
  const routeType = resolveSubdomainRoute(host, config);

  const sessionToken = req.cookies?.["__Host-Session"] || req.headers["authorization"];

  switch (routeType) {
    case "PUBLIC_MARKETING":
      // Public pages (landing, quotes, construction) never expose private API mutations
      return {
        routeType,
        rewrittenPath: `/marketing${req.url}`,
      };

    case "PORTAL_SHELL":
      // go.xero.com equivalent: must have active authenticated session
      if (!sessionToken) {
        // Invariant 1: Unauthenticated portal visits redirect to auth gateway
        const returnUrl = encodeURIComponent(`https://${host}${req.url}`);
        return {
          routeType,
          rewrittenPath: req.url,
          redirect: `https://${config.authGateway}/identity/user/login?returnUrl=${returnUrl}`,
        };
      }
      return {
        routeType,
        rewrittenPath: `/app${req.url}`,
      };

    case "AUTH_GATEWAY":
      // login.xero.com equivalent: isolated credential boundary
      return {
        routeType,
        rewrittenPath: `/auth${req.url}`,
      };

    default:
      return {
        routeType: "UNKNOWN",
        rewrittenPath: req.url,
      };
  }
}
