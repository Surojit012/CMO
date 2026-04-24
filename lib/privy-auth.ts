import { importSPKI, jwtVerify } from "jose";
import type { KeyLike } from "jose";
import type { NextRequest } from "next/server";

type PrivyAppConfigResponse = {
  verification_key?: string;
};

let verificationKeyPromise: Promise<KeyLike | null> | null = null;

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

async function getPrivyVerificationKey() {
  if (verificationKeyPromise) {
    return verificationKeyPromise;
  }

  verificationKeyPromise = (async () => {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!appId) {
      return null;
    }

    const configuredKey =
      process.env.PRIVY_JWT_VERIFICATION_KEY ||
      process.env.PRIVY_VERIFICATION_KEY;

    const verificationKeyPem =
      configuredKey?.trim() ||
      (
        await fetch(`https://auth.privy.io/api/v1/apps/${appId}`, {
          method: "GET",
          headers: {
            "privy-app-id": appId,
            Accept: "application/json"
          },
          cache: "force-cache"
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error("Unable to load Privy app config");
          }

          const appConfig = (await response.json()) as PrivyAppConfigResponse;
          return appConfig.verification_key?.trim() || null;
        })
      );

    if (!verificationKeyPem) {
      return null;
    }

    return importSPKI(verificationKeyPem, "ES256");
  })().catch(() => {
    verificationKeyPromise = null;
    return null;
  });

  return verificationKeyPromise;
}

export async function getPrivyUserIdFromRequest(request: NextRequest) {
  const token = getAuthToken(request);
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!token || !appId) {
    return null;
  }

  try {
    const verificationKey = await getPrivyVerificationKey();

    if (!verificationKey) {
      return null;
    }

    const { payload } = await jwtVerify(token, verificationKey, {
      issuer: "privy.io",
      audience: appId
    });

    return typeof payload.sub === "string" ? payload.sub.trim() || null : null;
  } catch {
    return null;
  }
}
