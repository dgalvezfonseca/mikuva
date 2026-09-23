import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { EditorialPage } from "./editorial-pages.server";

const editorialPageInput = z.object({
  slug: z.enum(["como-funciona", "faq", "nosotros", "servicios"]),
});

export type { EditorialPage };

export const getEditorialPage = createServerFn({ method: "GET" })
  .validator(editorialPageInput)
  .handler(async ({ data }): Promise<EditorialPage | null> => {
    const { getEditorialPageBySlug } = await import("./editorial-pages.server");
    return getEditorialPageBySlug(data.slug);
  });
