"use client";

export default function ConfirmSubmitButton({ children, message }: { children: React.ReactNode; message: string }) {
  return <button type="submit" onClick={event => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
