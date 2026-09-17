import "@tanstack/react-start/server-only";

const DEFAULT_TIMEOUT_MS = 5_000;

function getDirectusConfig() {
  const url = process.env["DIRECTUS_URL"]?.trim();
  const token = process.env["DIRECTUS_TOKEN"]?.trim();

  if (!url || !token) {
    return null;
  }

  return {
    url: url.replace(/\/+$/, ""),
    token,
  };
}

export async function directusFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const config = getDirectusConfig();

  if (!config) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  try {
    const response = await fetch(`${config.url}${normalizedPath}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        ...init.headers,
      },
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[Directus] ${response.status} ${response.statusText} ${normalizedPath}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("[Directus] Request failed:", error);
    return null;
  }
}
