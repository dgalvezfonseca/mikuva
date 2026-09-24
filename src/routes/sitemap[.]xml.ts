import { createFileRoute } from "@tanstack/react-router";

import { sitemapXml } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await sitemapXml(), {
          headers: { "content-type": "application/xml; charset=utf-8" },
        }),
    },
  },
});
