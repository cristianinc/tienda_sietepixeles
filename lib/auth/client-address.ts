import { isIP } from "node:net";

export function getLoginClientAddress(headers: Headers, trustForwarded = process.env.TRUST_PROXY_HEADERS === "true") {
  if (!trustForwarded) return "untrusted-client";

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded && isIP(forwarded)) return forwarded;

  const realIp = headers.get("x-real-ip")?.trim();
  return realIp && isIP(realIp) ? realIp : "unknown-proxy-client";
}
