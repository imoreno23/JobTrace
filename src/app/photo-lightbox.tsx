"use client";

import { useEffect, useState } from "react";

type Props = { src: string; alt: string; badge?: string; className?: string };

export default function PhotoLightbox({ src, alt, badge, className = "" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <>
    <button className={`photo-lightbox-trigger ${className}`} type="button" aria-label={`View photo: ${alt}`} onClick={() => setOpen(true)}>
      <img src={src} alt={alt} />
      {badge && <span>{badge}</span>}
    </button>
    {open && <div className="photo-lightbox-backdrop" role="presentation" onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="photo-lightbox-dialog" role="dialog" aria-modal="true" aria-label={alt}>
        <button className="photo-lightbox-close" type="button" aria-label="Close photo" onClick={() => setOpen(false)}>×</button>
        <img src={src} alt={alt} />
      </section>
    </div>}
  </>;
}
