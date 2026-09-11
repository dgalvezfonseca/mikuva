import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";

import ContactMap from "@/components/contact/ContactMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/constants/site";
import { submitContactForm } from "@/lib/contact";
import { CONTACT_MATERIALS } from "@/lib/contact-input";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/contacto")({
  head: () =>
    pageHead(
      "Contacto",
      "Cuéntanos qué recuerdos quieres digitalizar y recibe orientación para elegir el servicio adecuado.",
      "/contacto",
    ),
  component: ContactPage,
});

function ContactPage() {
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setIsSubmitting(true);
    setNotice("");

    try {
      const formData = new FormData(form);
      await submitContactForm({
        data: {
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          material: String(formData.get("material") ?? "") as (typeof CONTACT_MATERIALS)[number],
          message: String(formData.get("message") ?? ""),
          botcheck: formData.get("botcheck") === "on",
        },
      });
      form.reset();
      setNotice(
        "Recibimos tu mensaje. Te responderemos por los datos de contacto que compartiste.",
      );
    } catch {
      setNotice(
        "No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo en unos minutos.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
      <header className="max-w-3xl">
        <p className="eyebrow">Hablemos de tu archivo</p>
        <h1 className="display mt-4 text-4xl sm:text-5xl">Empieza por contarnos qué tienes.</h1>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
          Si no sabes qué servicio elegir, describe el formato, la cantidad aproximada y cualquier
          condición especial del material. Te orientaremos a partir de esos datos.
        </p>
      </header>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
        <aside className="rounded-lg bg-ink p-6 text-background sm:p-8">
          <p className="eyebrow text-primary">Contacto directo</p>
          <h2 className="display mt-4 text-3xl">También puedes encontrarnos aquí.</h2>
          <p className="mt-4 text-sm leading-relaxed text-background/70">
            Consulta la ubicación antes de traer tu material o llámanos para resolver una duda.
          </p>

          <dl className="my-8 space-y-6 border-y border-background/20 py-6 text-sm">
            <div className="grid grid-cols-[1.5rem_1fr] gap-3">
              <Phone className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
              <div>
                <dt className="font-semibold text-background">Teléfono</dt>
                <dd className="mt-1 text-background/70">
                  <a
                    href={`tel:${SITE.phoneHref}`}
                    className="underline-offset-4 hover:text-background hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {SITE.phone}
                  </a>
                </dd>
              </div>
            </div>
            <div className="grid grid-cols-[1.5rem_1fr] gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
              <div>
                <dt className="font-semibold text-background">Ubicación</dt>
                <dd className="mt-1 leading-relaxed text-background/70">{SITE.address}</dd>
              </div>
            </div>
          </dl>

          <ContactMap />
        </aside>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-6 sm:p-9"
          aria-describedby={notice ? "contact-form-notice" : undefined}
        >
          <h2 className="display text-2xl sm:text-3xl">Cuéntanos sobre tu material</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Completa los datos para que podamos entender qué necesitas y responderte directamente.
          </p>
          <input
            type="checkbox"
            name="botcheck"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="contact-name">Nombre</Label>
              <Input
                id="contact-name"
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Teléfono</Label>
              <Input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                minLength={8}
                maxLength={32}
                pattern="[0-9+() .-]+"
                required
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="material-type">Tipo de material</Label>
              <select
                id="material-type"
                name="material"
                required
                defaultValue=""
                className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Selecciona una opción
                </option>
                {CONTACT_MATERIALS.map((material) => (
                  <option key={material}>{material}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="contact-message">Mensaje</Label>
              <Textarea
                id="contact-message"
                name="message"
                required
                minLength={10}
                maxLength={2000}
                rows={7}
                className="mt-2"
                placeholder="Cuéntanos aproximadamente cuánto material tienes y cómo está guardado."
              />
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            className="mt-6 min-h-11 w-full rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando…" : "Enviar consulta"}
          </Button>
          {notice && (
            <p
              id="contact-form-notice"
              role="status"
              aria-live="polite"
              className="mt-4 rounded-lg bg-sand p-4 text-sm text-foreground"
            >
              {notice}
            </p>
          )}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Mikuva recibirá estos datos para responder tu consulta.
          </p>
        </form>
      </div>
    </div>
  );
}
