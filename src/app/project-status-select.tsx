"use client";

import { updateProjectStatus } from "./actions";

export default function ProjectStatusSelect({ id, status, showLabel = false }: { id: string; status: string; showLabel?: boolean }) {
  return <form action={updateProjectStatus} className="account-status-form">
    <input type="hidden" name="id" value={id} />
    {showLabel && <label className="account-status-label" htmlFor={`project-status-${id}`}>Status</label>}
    <select id={`project-status-${id}`} name="status" defaultValue={status} aria-label="Change project status" onChange={event => event.currentTarget.form?.requestSubmit()}>
      <option>Planned</option><option>In Progress</option><option>Completed</option>
    </select>
  </form>;
}
