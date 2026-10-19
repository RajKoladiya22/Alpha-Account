// Invariant 1: Domain Separation Configuration

export interface SubdomainConfig {
  marketing: string;  // e.g. "xero.domain.com" or "www.domain.com"
  appShell: string;   // e.g. "go.domain.com" or "app.domain.com"
  authGateway: string;// e.g. "login.domain.com" or "auth.domain.com"
}

export const DEFAULT_DOMAINS: SubdomainConfig = {
  marketing: "www.fintech-platform.local",
  appShell: "go.fintech-platform.local",
  authGateway: "login.fintech-platform.local",
};

export type SubdomainRouteType = "PUBLIC_MARKETING" | "PORTAL_SHELL" | "AUTH_GATEWAY" | "UNKNOWN";

export function resolveSubdomainRoute(hostname: string, config: SubdomainConfig = DEFAULT_DOMAINS): SubdomainRouteType {
  const host = hostname.toLowerCase().split(":")[0];
  if (host === config.marketing.toLowerCase()) return "PUBLIC_MARKETING";
  if (host === config.appShell.toLowerCase()) return "PORTAL_SHELL";
  if (host === config.authGateway.toLowerCase()) return "AUTH_GATEWAY";
  
  // Prefix matching fallback (e.g. go.*, login.*)
  if (host.startsWith("login.") || host.startsWith("auth.")) return "AUTH_GATEWAY";
  if (host.startsWith("go.") || host.startsWith("app.")) return "PORTAL_SHELL";
  return "PUBLIC_MARKETING";
}
