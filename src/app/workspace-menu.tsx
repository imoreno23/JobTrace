"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function WorkspaceMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return <>
    <button className="workspace-menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="workspace-menu" onClick={() => setOpen(value => !value)}>
      <span aria-hidden="true">{open ? "×" : "☰"}</span>
    </button>
    {open && <div className="workspace-menu-layer">
      <button className="workspace-menu-backdrop" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
      <nav className="workspace-menu-panel" id="workspace-menu" aria-label="Workspace navigation">
        <div className="workspace-menu-heading"><span className="eyebrow">WORKSPACE</span><button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>×</button></div>
        <Link href="/#workspace-home" onClick={() => setOpen(false)}><span aria-hidden="true">⌂</span>Home</Link>
        <Link href="/#workspace-projects" onClick={() => setOpen(false)}><span aria-hidden="true">⚒</span>Projects</Link>
        <a className="workspace-menu-demo" href="/prototype/index.html"><span aria-hidden="true">↗</span>Open demo preview</a>
      </nav>
    </div>}
  </>;
}
