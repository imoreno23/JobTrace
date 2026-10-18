"use client";

import { updateProjectStatus } from "./actions";

export default function ProjectStatusSelect({ id, status, className = "" }: { id: string; status: string; className?: string }) {
  return <form action={updateProjectStatus} className={`account-status-form ${className}`}>
    <input type="hidden" name="id" value={id} />
    <select name="status" defaultValue={status} aria-label="Change project status" onChange={event => event.currentTarget.form?.requestSubmit()}>
      <option>Planned</option><option>In Progress</option><option>Completed</option>
    </select>
  </form>;
}
