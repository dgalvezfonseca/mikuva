import { useState } from "react";

type GalleryImage = {
  url: string;
  alt: string;
};

export default function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="min-w-0">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {current ? (
          <img
            src={current.url}
            alt={current.alt}
            width={1200}
            height={900}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div
            className="flex aspect-[4/3] items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground"
            role="img"
            aria-label={`Imagen no disponible para ${name}`}
          >
            Imagen no disponible
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3" role="group" aria-label="Vistas del servicio">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Mostrar vista ${index + 1}`}
              aria-pressed={active === index}
              className={`overflow-hidden rounded-md border-2 ${active === index ? "border-primary" : "border-transparent"}`}
            >
              <img src={image.url} alt="" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
