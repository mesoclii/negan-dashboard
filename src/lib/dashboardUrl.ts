import type { NextRequest } from "next/server";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) return value;
  }
  return "";
}

function originFromUrl(input: string) {
  if (!input) return "";
  try {
    return trimTrailingSlash(new URL(input).origin);
  } catch {
    return "";
  }
}

export function getDashboardPublicOrigin(request?: NextRequest) {
  const explicit = firstEnv("DASHBOARD_PUBLIC_URL", "NEXT_PUBLIC_DASHBOARD_URL");
  const explicitOrigin = originFromUrl(explicit);
  if (explicitOrigin) return explicitOrigin;

  const redirectOrigin = originFromUrl(String(process.env.DISCORD_REDIRECT_URI || "").trim());
  if (redirectOrigin) return redirectOrigin;

  if (request) {
    const forwardedHost = String(request.headers.get("x-forwarded-host") || request.headers.get("host") || "").trim();
    const forwardedProto = String(request.headers.get("x-forwarded-proto") || "").trim();
    if (forwardedHost) {
      const proto = forwardedProto || request.nextUrl.protocol.replace(/:$/, "") || "http";
      return `${proto}://${forwardedHost}`;
    }
    return trimTrailingSlash(request.nextUrl.origin);
  }

  return "http://127.0.0.1:3000";
}

export function buildDashboardUrl(pathname: string, request?: NextRequest) {
  return new URL(pathname, `${getDashboardPublicOrigin(request)}/`);
}
