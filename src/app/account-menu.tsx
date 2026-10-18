"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "./actions";

type Props = { email: string; workspaceName: string };

export default function AccountMenu({ email, workspaceName }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("click", closeOnOutsideClick);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("click", closeOnOutsideClick);
    };
  }, [open]);

  return <div className="account-menu" ref={menuRef}>
    <button className="account-avatar-button" type="button" aria-label="Open user settings" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      {email.slice(0, 1).toUpperCase()}
    </button>
    {open && <section className="account-menu-popover" role="dialog" aria-label="User settings">
      <div className="account-menu-title"><span>USER SETTINGS</span><button type="button" aria-label="Close user settings" onClick={() => setOpen(false)}>×</button></div>
      <div className="account-menu-field"><span>Email</span><strong>{email}</strong></div>
      <div className="account-menu-field"><span>Workspace</span><strong>{workspaceName}</strong></div>
      <form action={signOut}><button className="account-menu-signout" type="submit">Sign out</button></form>
    </section>}
  </div>;
}
