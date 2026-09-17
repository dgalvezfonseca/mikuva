import "@tanstack/react-start/server-only";

const ASSET_TIMEOUT_MS = 5_000;
const ASSET_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ASSET_HEADERS = ["content-type", "content-length", "etag", "last-modified"] as const;

type AssetMethod = "GET" | "HEAD";

function getDirectusAssetConfig() {
  const url = process.env["DIRECTUS_URL"]?.trim();
  const token = process.env["DIRECTUS_TOKEN"]?.trim();

  if (!url || !token) return null;

  return { url: url.replace(/\/+$/, ""), token };
}

function isAssetId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function responseHeaders(upstream: Response): Headers {
  const headers = new Headers({ "Cache-Control": ASSET_CACHE_CONTROL });

  for (const name of ASSET_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return headers;
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

export async function getDirectusAsset(assetId: string, method: AssetMethod): Promise<Response> {
  if (!isAssetId(assetId)) return emptyResponse(404);

  const config = getDirectusAssetConfig();
  if (!config) return emptyResponse(502);

  try {
    const upstream = await fetch(`${config.url}/assets/${assetId}`, {
      method,
      headers: { Authorization: `Bearer ${config.token}` },
      redirect: "error",
      signal: AbortSignal.timeout(ASSET_TIMEOUT_MS),
    });

    if (upstream.status === 404 || upstream.status === 403) return emptyResponse(404);
    if (!upstream.ok) return emptyResponse(502);

    return new Response(method === "HEAD" ? null : upstream.body, {
      status: 200,
      headers: responseHeaders(upstream),
    });
  } catch {
    return emptyResponse(502);
  }
}
