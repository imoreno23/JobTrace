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
      <Link className="workspace-brand" href="/#workspace-home" onClick={close}><span className="workspace-brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M8 7h16v18H8z"/><path d="M12 12h8M12 16h5M12 20h8"/></svg></span><span>jobtrace<span className="workspace-brand-dot">.</span></span></Link>
      <div className="workspace-nav-label">WORKSPACE</div>
      <nav className="workspace-nav">
        <Link className="workspace-nav-item active" href="/#workspace-home" onClick={close}><span className="workspace-nav-icon" aria-hidden="true">⌂</span>Home</Link>
        <Link className="workspace-nav-item" href="/#project-list" onClick={close}><span className="workspace-nav-icon" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m11.8 3.1 5.1 5.1-2.2 2.2-1.6-1.6-6.8 6.8a1.6 1.6 0 0 1-2.3-2.3l6.8-6.8-1.6-1.6z"/><path d="m9.2 4.4 2.2-2.2 4.6 4.6-2.2 2.2z"/></svg></span>Projects<span className="workspace-nav-count">{projectCount}</span></Link>
        <Link className="workspace-nav-item" href="/#customers-summary" onClick={close}><span className="workspace-nav-icon" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="6.2" r="3"/><path d="M4.2 17c.4-3.2 2.5-5 5.8-5s5.4 1.8 5.8 5z"/></svg></span>Customers</Link>
        <Link className="workspace-nav-item" href="/#photos-summary" onClick={close}><span className="workspace-nav-icon" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M3 4.5c2.8-.9 5.1-.7 7 1v11c-1.9-1.7-4.2-1.9-7-1zM17 4.5c-2.8-.9-5.1-.7-7 1v11c1.9-1.7 4.2-1.9 7-1z"/><path d="M5.3 7.2c1.1-.2 2.1-.1 3 .3M5.3 10c1.1-.2 2.1-.1 3 .3M11.7 7.5c1-.4 2-.5 3-.3M11.7 10.3c1-.4 2-.5 3-.3"/></svg></span>Photo library</Link>
      </nav>
      <div className="workspace-sidebar-bottom">
        <div className="workspace-storage-card"><div className="workspace-storage-icon" aria-hidden="true">✳</div><strong>Your work, all together.</strong><p>Keep every photo and project detail within reach.</p><a href="/#project-list" onClick={close}>View your projects <span>→</span></a></div>
        <div className="workspace-profile"><span className="workspace-avatar">{initials}</span><span className="workspace-profile-copy"><strong>{email.split("@")[0]}</strong><span>JobTrace workspace</span></span></div>
      </div>
    </aside>
  </>;
}
