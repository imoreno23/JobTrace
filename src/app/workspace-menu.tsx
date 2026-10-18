"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = { email: string; projectCount: number };

export default function WorkspaceMenu({ email, projectCount }: Props) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const close = () => setOpen(false);
  const initials = email.split("@")[0].slice(0, 2).toUpperCase() || "JT";

  return <>
    <button className="workspace-menu-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="workspace-sidebar" onClick={() => setOpen(value => !value)}>
      <span aria-hidden="true">{open ? "×" : "☰"}</span>
    </button>
    {open && <button className="workspace-menu-backdrop" type="button" aria-label="Close navigation" onClick={close} />}
    <aside className={`workspace-sidebar${open ? " open" : ""}`} id="workspace-sidebar" aria-label="Main navigation">
      <Link className="workspace-brand" href="/#workspace-home" onClick={close}><span className="workspace-brand-mark" aria-hidden="true">▤</span><span>jobtrace<span className="workspace-brand-dot">.</span></span></Link>
      <div className="workspace-nav-label">WORKSPACE</div>
      <nav className="workspace-nav">
        <Link className="workspace-nav-item active" href="/#workspace-home" onClick={close}><span className="workspace-nav-icon" aria-hidden="true">⌂</span>Home</Link>
        <Link className="workspace-nav-item" href="/#project-list" onClick={close}><span className="workspace-nav-icon" aria-hidden="true">⚒</span>Projects<span className="workspace-nav-count">{projectCount}</span></Link>
        <Link className="workspace-nav-item" href="/#customers-summary" onClick={close}><span className="workspace-nav-icon" aria-hidden="true">♙</span>Customers</Link>
        <Link className="workspace-nav-item" href="/#photos-summary" onClick={close}><span className="workspace-nav-icon" aria-hidden="true">▤</span>Photo library</Link>
      </nav>
      <div className="workspace-sidebar-bottom">
        <div className="workspace-storage-card"><div className="workspace-storage-icon" aria-hidden="true">✳</div><strong>Your work, all together.</strong><p>Keep every photo and project detail within reach.</p><a href="/#project-list" onClick={close}>View your projects <span>→</span></a></div>
        <div className="workspace-profile"><span className="workspace-avatar">{initials}</span><span className="workspace-profile-copy"><strong>{email.split("@")[0]}</strong><span>JobTrace workspace</span></span></div>
      </div>
    </aside>
  </>;
}
