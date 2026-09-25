import { createFileRoute } from "@tanstack/react-router";

import { isAuthorizedCatalogSync } from "@/lib/catalog-sync-auth.server";
import { synchronizeDirectusCatalog } from "@/lib/catalog-sync.server";

export const Route = createFileRoute("/api/internal/directus-catalog-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorizedCatalogSync(request)) {
          return Response.json({ synchronized: false }, { status: 401 });
        }
        try {
          return Response.json({ synchronized: true, ...(await synchronizeDirectusCatalog()) });
        } catch (error) {
          console.error("[directus-catalog-sync] failed", {
            error: error instanceof Error ? error.name : "UnknownError",
          });
          return Response.json({ synchronized: false }, { status: 422 });
        }
      },
      ANY: () =>
        Response.json({ synchronized: false }, { status: 405, headers: { Allow: "POST" } }),
    },
  },
});
