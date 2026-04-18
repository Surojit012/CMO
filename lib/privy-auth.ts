import type { NextRequest } from "next/server";

function decodeJwtSubject(token: string) {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      sub?: string;
      userId?: string;
      did?: string;
    };

    return payload.sub || payload.userId || payload.did || null;
  } catch {
    return null;
  }
}

export function getPrivyUserIdFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    return decodeJwtSubject(token) || token || null;
  }

  const headerUserId = request.headers.get("x-privy-user-id");
  return headerUserId?.trim() || null;
}
