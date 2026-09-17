import { Link } from "@tanstack/react-router";

import { LEGAL_NAV, MAIN_NAV } from "@/constants/site";
import type { FooterSiteSettings } from "@/lib/site-settings";

import Logo from "./Logo";

type FooterProps = {
  siteSettings: FooterSiteSettings;
};

export default function Footer({ siteSettings }: FooterProps) {
  return (
    <footer className="mt-24 border-t border-border bg-ivory">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Preservamos recuerdos familiares con digitalización profesional y trato cuidadoso de
            cada original.
          </p>
        </div>

        <nav aria-label="Navegación del sitio">
          <h2 className="text-sm font-semibold text-foreground">Navegación</h2>
          <ul className="mt-4 space-y-2.5">
            {MAIN_NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/pedido"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Consultar pedido
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Información legal">
          <h2 className="text-sm font-semibold text-foreground">Legal</h2>
          <ul className="mt-4 space-y-2.5">
            {LEGAL_NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Contacto</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              Teléfono:{" "}
              <a className="hover:text-foreground" href={`tel:${siteSettings.phoneHref}`}>
                {siteSettings.phone}
              </a>
            </li>
            <li>{siteSettings.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} {siteSettings.name}. Todos los derechos reservados.
          </p>
          <p>Hecho con cuidado para historias que no se repiten.</p>
        </div>
      </div>
    </footer>
  );
}
