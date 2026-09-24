import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const cmsPageInput = z.object({ slug: z.string().max(160) });

export type { CmsPage, CmsSection } from "./cms-pages.server";

export const getCmsPage = createServerFn({ method: "GET" })
  .validator(cmsPageInput)
  .handler(async ({ data }) => {
    const { getCmsPageBySlug } = await import("./cms-pages.server");
    return getCmsPageBySlug(data.slug);
  });
