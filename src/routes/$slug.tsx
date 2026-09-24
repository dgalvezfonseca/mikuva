import { createFileRoute, notFound } from "@tanstack/react-router";

import CmsPageRenderer from "@/components/cms/CmsPageRenderer";
import { getCmsPage } from "@/lib/cms-pages";
import { isCmsSlug } from "@/lib/cms-routes";
import { SITE } from "@/constants/site";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    if (!isCmsSlug(params.slug)) throw notFound();
    const page = await getCmsPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    const page = loaderData;
    if (!page) return {};
    const head = pageHead(
      page.metaTitle || page.title,
      page.metaDescription || page.intro,
      `/${page.slug}`,
      {
        robots: page.indexable ? "index,follow" : "noindex,follow",
      },
    );
    return page.ogImageUrl
      ? {
          ...head,
          meta: [
            ...head.meta,
            { property: "og:image", content: new URL(page.ogImageUrl, SITE.url).toString() },
          ],
        }
      : head;
  },
  component: CmsPageRoute,
});

function CmsPageRoute() {
  return <CmsPageRenderer page={Route.useLoaderData()} />;
}
