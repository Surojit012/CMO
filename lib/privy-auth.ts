import type { NextRequest } from "next/server";

type PrivyUserResponse = {
  id?: string;
};

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

export async function getPrivyUserIdFromRequest(request: NextRequest) {
  const token = getBearerToken(request);
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!token || !appId) {
    return null;
  }

  try {
    const response = await fetch("https://auth.privy.io/api/v1/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "privy-app-id": appId,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as PrivyUserResponse;
    return user.id?.trim() || null;
  } catch {
    return null;
  }
}
