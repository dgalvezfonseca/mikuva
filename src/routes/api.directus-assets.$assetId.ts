import { createFileRoute } from "@tanstack/react-router";

import { getDirectusAsset } from "@/lib/directus-assets.server";

export const Route = createFileRoute("/api/directus-assets/$assetId")({
  server: {
    handlers: {
      GET: ({ params }) => getDirectusAsset(params.assetId, "GET"),
      HEAD: ({ params }) => getDirectusAsset(params.assetId, "HEAD"),
      ANY: () => new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } }),
    },
  },
});
