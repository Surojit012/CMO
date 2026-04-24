import type { NextRequest } from "next/server";

type PrivyUserResponse = {
  id?: string;
};

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const headerToken = authHeader.slice("Bearer ".length).trim();
    if (headerToken) {
      return headerToken;
    }
  }

  const cookieToken = request.cookies.get("privy-token")?.value?.trim();
  return cookieToken || null;
}

export async function getPrivyUserIdFromRequest(request: NextRequest) {
  const token = getAuthToken(request);
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
