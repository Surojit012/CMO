const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./
];

export function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isPrivateHostname(hostname: string) {
  if (BLOCKED_HOSTS.has(hostname)) {
    return true;
  }

  if (hostname.endsWith(".local")) {
    return true;
  }

  return PRIVATE_IPV4_PATTERNS.some((pattern) => pattern.test(hostname));
}

export function parseAndValidateUrl(rawValue: string) {
  const normalizedUrl = normalizeUrl(rawValue);
  const url = new URL(normalizedUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  if (!url.hostname.includes(".")) {
    throw new Error("Enter a valid public website URL.");
  }

  if (isPrivateHostname(url.hostname)) {
    throw new Error("Private or local network URLs are not supported.");
  }

  return url;
}
