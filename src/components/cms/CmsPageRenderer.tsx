import FAQAccordion from "@/components/faq/FAQAccordion";
import { Section, SectionHeading } from "@/components/ui/section";
import type { CmsPage, CmsSection } from "@/lib/cms-pages";

function Actions({
  actions,
}: {
  actions: Extract<CmsSection, { type: "hero" | "cta" }>["actions"];
}) {
  return actions.length ? (
    <div className="mt-7 flex flex-wrap gap-3">
      {actions.map((action) => (
        <a
          key={`${action.label}-${action.href}`}
          href={action.href}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {action.label}
        </a>
      ))}
    </div>
  ) : null;
}

function Paragraphs({ paragraphs }: { paragraphs: string[] }) {
  return paragraphs.length ? (
    <div className="mt-6 space-y-5 leading-relaxed text-muted-foreground">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  ) : null;
}

function Block({ section }: { section: CmsSection }) {
  switch (section.type) {
    case "hero":
      return (
        <section className="bg-ivory px-5 py-16 md:py-24 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <div>
              {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
              {section.title && (
                <h2 className="display mt-4 text-4xl sm:text-5xl">{section.title}</h2>
              )}
              {section.description && (
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
              )}
              <Paragraphs paragraphs={section.paragraphs} />
              <Actions actions={section.actions} />
            </div>
            {section.imageUrl && (
              <img
                src={section.imageUrl}
                alt={section.imageAlt || section.title}
                width={1408}
                height={768}
                className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
              />
            )}
          </div>
        </section>
      );
    case "rich_text":
      return (
        <Section>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
          />
          <Paragraphs paragraphs={section.paragraphs} />
        </Section>
      );
    case "image_text":
      return (
        <Section tone="sand">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            {section.imageUrl && (
              <img
                src={section.imageUrl}
                alt={section.imageAlt || section.title}
                loading="lazy"
                width={1408}
                height={768}
                className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
              />
            )}
            <div>
              <SectionHeading
                eyebrow={section.eyebrow}
                title={section.title}
                description={section.description}
              />
              <Paragraphs paragraphs={section.paragraphs} />
            </div>
          </div>
        </Section>
      );
    case "benefits":
      return (
        <Section>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
          />
          {section.items.length > 0 && (
            <ul className="mt-8 max-w-2xl space-y-4 leading-relaxed text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Section>
      );
    case "gallery":
      return (
        <Section tone="ivory">
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
          />
          {section.images.length > 0 && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {section.images.map((image) => (
                <img
                  key={image.url}
                  src={image.url}
                  alt={image.alt}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="aspect-[4/3] w-full rounded-xl border border-border object-cover"
                />
              ))}
            </div>
          )}
        </Section>
      );
    case "faq":
      return (
        <Section>
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
          />
          {section.items.length > 0 && (
            <div className="mt-8 max-w-3xl">
              <FAQAccordion items={section.items} />
            </div>
          )}
        </Section>
      );
    case "cta":
      return (
        <Section tone="sand">
          <SectionHeading
            eyebrow={section.eyebrow}
            title={section.title}
            description={section.description}
          />
          <Actions actions={section.actions} />
        </Section>
      );
  }
}

export default function CmsPageRenderer({ page }: { page: CmsPage }) {
  const hasHero = page.sections.some((section) => section.type === "hero");

  return (
    <main>
      {!hasHero && (
        <section className="mx-auto max-w-3xl px-5 py-16 md:py-24 lg:px-8">
          {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
          <h1 className="display mt-4 text-4xl sm:text-5xl">{page.title}</h1>
          {page.intro && (
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{page.intro}</p>
          )}
        </section>
      )}
      {page.sections.map((section) => (
        <Block key={section.id} section={section} />
      ))}
    </main>
  );
}
