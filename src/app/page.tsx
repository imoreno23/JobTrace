import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addProjectNote, createProject, deleteProjectPhoto, saveCustomer, savePhotoComparison, setProjectArchived, updateProject, uploadProjectPhotos } from "./actions";
import AccountMenu from "./account-menu";
import WorkspaceMenu from "./workspace-menu";
import ProjectStatusSelect from "./project-status-select";
import ConfirmSubmitButton from "./confirm-submit-button";

type Project = {
  id: string;
  name: string;
  type: string;
  status: "Planned" | "In Progress" | "Completed";
  property_address: string;
  created_at: string;
  customer_id: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string;
  archived: boolean;
};

type Customer = { id: string; name: string; email: string | null; phone: string | null; address: string | null; notes: string };
type Photo = { id: string; project_id: string; object_path: string; category: string; caption: string; created_at: string; taken_at: string | null };
type Note = { id: string; project_id: string; body: string; created_at: string };
type Comparison = { id: string; project_id: string; before_photo_id: string; after_photo_id: string };
type Activity = { id: string; message: string; created_at: string };
type View = "home" | "projects" | "customers" | "photos" | "detail" | "search";
type Props = { searchParams: Promise<{ created?: string; error?: string; q?: string; view?: string; project?: string; tab?: string; filter?: string; category?: string; photo_category?: string; customer_status?: string }> };

function ProjectForm({ project, customers = [] }: { project?: Project; customers?: Customer[] }) {
  return <form action={project ? updateProject : createProject} className="project-create-form account-editor-form">
    {project && <input type="hidden" name="id" value={project.id} />}
    <label>Project name<input name="name" required maxLength={120} defaultValue={project?.name} placeholder="e.g. Oak Street bathroom remodel" /></label>
    <label>Project type<select name="type" defaultValue={project?.type ?? "Bathroom remodel"}>
      <option>Bathroom remodel</option><option>Kitchen remodel</option><option>Repair</option><option>Painting</option><option>Carpentry</option><option>Electrical</option><option>Plumbing</option><option>Other</option>
    </select></label>
    <label>Status<select name="status" defaultValue={project?.status ?? "Planned"}><option>Planned</option><option>In Progress</option><option>Completed</option></select></label>
    <label>Customer<select name="customer_id" defaultValue={project?.customer_id ?? ""}><option value="">No customer</option>{customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
    <label className="account-field-wide">Property address<input name="property_address" defaultValue={project?.property_address ?? ""} /></label>
    <label>Start date<input name="start_date" type="date" defaultValue={project?.start_date ?? ""} /></label>
    <label>Completion date<input name="end_date" type="date" defaultValue={project?.end_date ?? ""} /></label>
    <label className="account-field-wide">Description<textarea name="description" rows={3} defaultValue={project?.description ?? ""} /></label>
    <button className="button button-primary" type="submit">{project ? "Save project" : "Create project"} <span aria-hidden="true">→</span></button>
  </form>;
}

function CustomerForm({ customer }: { customer?: Customer }) {
  return <form action={saveCustomer} className="project-create-form account-editor-form">
    {customer && <input type="hidden" name="id" value={customer.id} />}
    <label>Name<input name="name" required maxLength={120} defaultValue={customer?.name} /></label>
    <label>Email<input name="email" type="email" defaultValue={customer?.email ?? ""} /></label>
    <label>Phone<input name="phone" type="tel" defaultValue={customer?.phone ?? ""} /></label>
    <label>Address<input name="address" defaultValue={customer?.address ?? ""} /></label>
    <label className="account-field-wide">Notes<textarea name="notes" rows={3} defaultValue={customer?.notes ?? ""} /></label>
    <button className="button button-primary" type="submit">{customer ? "Save changes" : "Add customer"}</button>
  </form>;
}

function ProjectRow({ project, customer }: { project: Project; customer?: Customer }) {
  return <article className={`account-project-row${project.archived ? " is-archived" : ""}`}>
    <div className="account-project-thumb" aria-hidden="true"><span>⌂</span></div>
    <div className="account-project-main"><Link href={`/?view=detail&project=${project.id}`}>{project.name}</Link><span>{project.type} · {project.property_address || "Address not added"}</span></div>
    <div className="account-project-customer">{customer?.name ?? "No customer"}</div>
    <ProjectStatusSelect id={project.id} status={project.status} />
    <details className="account-row-menu"><summary aria-label={`Project options for ${project.name}`}>···</summary><div><Link href={`/?view=detail&project=${project.id}`}>Open details &amp; edit</Link><form action={setProjectArchived}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="archived" value={String(!project.archived)} /><button>{project.archived ? "Restore project" : "Archive project"}</button></form></div></details>
  </article>;
}

function CustomerRow({ customer, projects }: { customer: Customer; projects: Project[] }) {
  const jobs = projects.filter(project => project.customer_id === customer.id && !project.archived);
  const statuses = [...new Set(jobs.map(project => project.status))];
  return <article className="workspace-data-row">
    <div className="workspace-data-avatar" aria-hidden="true">{customer.name.slice(0, 1).toUpperCase()}</div>
    <div className="workspace-customer-main"><strong>{customer.name}</strong><span>{customer.email || customer.phone || "No contact details"}</span></div>
    <span>{customer.address || "Address not added"}</span>
    <div className="workspace-customer-jobs"><strong>{jobs.length} {jobs.length === 1 ? "job" : "jobs"}</strong><span>{statuses.length ? statuses.join(" · ") : "No active jobs"}</span></div>
    <div className="account-customer-actions"><Link href={`/?view=projects&q=${encodeURIComponent(customer.name)}`}>View jobs</Link><details className="account-inline-edit"><summary>Edit</summary><CustomerForm customer={customer} /></details></div>
  </article>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null };

  if (data?.claims && supabase) {
    const [{ data: business }, { data: projects }, { data: customers, count: customerCount }, { data: photos, count: photoCount }, { data: notes }, { data: comparisons }, { data: activity }] = await Promise.all([
      supabase.from("businesses").select("id, name").maybeSingle(),
      supabase.from("projects").select("id, name, type, status, property_address, created_at, customer_id, start_date, end_date, description, archived").order("created_at", { ascending: false }),
      supabase.from("customers").select("id, name, email, phone, address, notes", { count: "exact" }).order("name"),
      supabase.from("project_photos").select("id, project_id, object_path, category, caption, created_at, taken_at", { count: "exact" }).order("created_at", { ascending: false }),
      supabase.from("project_notes").select("id, project_id, body, created_at").order("created_at", { ascending: false }),
      supabase.from("project_photo_comparisons").select("id, project_id, before_photo_id, after_photo_id"),
      supabase.from("workspace_activity").select("id, message, created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    const ownProjects = (projects ?? []) as Project[];
    const ownCustomers = (customers ?? []) as Customer[];
    const customerById = new Map(ownCustomers.map(customer => [customer.id, customer]));
    const liveProjects = ownProjects.filter(project => !project.archived);
    const activeCount = liveProjects.filter(project => project.status === "In Progress").length;
    const completedCount = liveProjects.filter(project => project.status === "Completed").length;
    const email = typeof data.claims.email === "string" ? data.claims.email : "JobTrace user";
    const workspaceName = business?.name ?? "My Business";
    const view: View = params.view === "projects" || params.view === "customers" || params.view === "photos" || params.view === "detail" || params.view === "search" ? params.view : "home";
    const query = params.q?.trim().toLowerCase() ?? "";
    const visibleProjects = ownProjects.filter(project => (params.filter === "Archived" ? project.archived : params.filter && params.filter !== "all" ? !project.archived && project.status === params.filter : !project.archived) && (!query || `${project.name} ${project.type} ${project.property_address} ${project.description} ${customerById.get(project.customer_id ?? "")?.name ?? ""}`.toLowerCase().includes(query)));
    const globalProjects = ownProjects.filter(project => !query || `${project.name} ${project.type} ${project.property_address} ${project.description} ${customerById.get(project.customer_id ?? "")?.name ?? ""}`.toLowerCase().includes(query));
    const ownPhotos = (photos ?? []) as Photo[];
    const visibleCustomers = ownCustomers.filter(customer => (!query || `${customer.name} ${customer.email ?? ""} ${customer.phone ?? ""} ${customer.address ?? ""}`.toLowerCase().includes(query)) && (!params.customer_status || params.customer_status === "all" || (params.customer_status === "No active jobs" ? !liveProjects.some(project => project.customer_id === customer.id) : liveProjects.some(project => project.customer_id === customer.id && project.status === params.customer_status))));
    const visiblePhotos = ownPhotos.filter(photo => (!query || `${photo.caption} ${photo.category} ${photo.object_path} ${ownProjects.find(project => project.id === photo.project_id)?.name ?? ""}`.toLowerCase().includes(query)) && (!params.category || params.category === "all" || photo.category === params.category));
    const { data: signedPhotoUrls } = ownPhotos.length ? await supabase.storage.from("project-photos").createSignedUrls(ownPhotos.map(photo => photo.object_path), 3600) : { data: [] };
    const photoUrlById = new Map(ownPhotos.map((photo, index) => [photo.id, signedPhotoUrls?.[index]?.signedUrl ?? ""]));
    const ownNotes = (notes ?? []) as Note[];
    const ownComparisons = (comparisons ?? []) as Comparison[];
    const ownActivity = (activity ?? []) as Activity[];
    const activeProject = ownProjects.find(project => project.id === params.project);
    const selectedTab = params.tab === "journal" || params.tab === "comparison" ? params.tab : "photos";
    const selectedPhotoCategory = params.photo_category ?? "all";
    const detailPhotos = ownPhotos.filter(photo => photo.project_id === activeProject?.id && (selectedPhotoCategory === "all" || photo.category === selectedPhotoCategory));
    const pageTitle = view === "home" ? "Home" : view === "projects" ? "Projects" : view === "customers" ? "Customers" : view === "photos" ? "Photo library" : view === "search" ? "Search" : "Project details";

    return <div className="account-app-shell">
      <WorkspaceMenu email={email} projectCount={liveProjects.length} view={view === "detail" || view === "search" ? "home" : view} />
      <main className="account-main-area">
        <header className="account-topbar">
          <div className="account-breadcrumb"><span>Workspace</span><span className="account-crumb-slash">/</span><strong>{pageTitle}</strong></div>
          <AccountMenu email={email} workspaceName={workspaceName} />
        </header>
        <div className="account-page-content" id="workspace-home">
          {view === "search" ? <>
            <section className="account-page-heading"><div><span className="account-eyebrow">SEARCH</span><h1>Search your work</h1><p>{query ? `Results for “${params.q}”` : "Search projects, photos, and customers."}</p></div></section>
            <div className="account-page-toolbar"><form className="account-page-search" action="/"><input type="hidden" name="view" value="search" /><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder="Search projects, photos, customers..." aria-label="Search your work" /><button type="submit">Search</button></form></div>
            <section className="account-recent-projects"><div className="account-section-heading"><h2>Projects · {globalProjects.length}</h2></div><div className="account-project-list">{globalProjects.slice(0, 6).map(project => <ProjectRow key={project.id} project={project} customer={customerById.get(project.customer_id ?? "")} />)}{globalProjects.length === 0 && <p className="account-empty-note">No matching projects.</p>}</div></section>
            <section className="account-recent-projects account-search-results"><div className="account-section-heading"><h2>Photos · {visiblePhotos.length}</h2></div><div className="workspace-photo-grid">{visiblePhotos.slice(0, 8).map(photo => <article className="workspace-photo-card" key={photo.id}><a href={photoUrlById.get(photo.id) || "#"} target="_blank" rel="noreferrer"><img src={photoUrlById.get(photo.id) || ""} alt={photo.caption || "Project photo"} /><span>{photo.category}</span></a><strong>{photo.caption || "Untitled photo"}</strong><small>{ownProjects.find(project => project.id === photo.project_id)?.name ?? "Project"}</small></article>)}</div></section>
            <section className="account-recent-projects account-search-results"><div className="account-section-heading"><h2>Customers · {visibleCustomers.length}</h2></div><div className="workspace-data-list">{visibleCustomers.map(customer => <CustomerRow key={customer.id} customer={customer} projects={liveProjects} />)}</div></section>
          </> : view === "projects" ? <>
            <section className="account-page-heading"><div><span className="account-eyebrow">YOUR WORK</span><h1>Projects</h1><p>Every job, organized from first visit to final result.</p></div><details className="account-new-project"><summary className="account-button account-button-primary">New project <span aria-hidden="true">＋</span></summary><ProjectForm customers={ownCustomers} /></details></section>
            <div className="account-page-toolbar"><form className="account-page-search" action="/"><input type="hidden" name="view" value="projects" /><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder="Search projects..." aria-label="Search projects" /><button type="submit">Search</button></form><form className="account-filter-form"><input type="hidden" name="view" value="projects" /><select name="filter" defaultValue={params.filter ?? "all"} aria-label="Filter projects by status"><option value="all">All projects</option><option>In Progress</option><option>Planned</option><option>Completed</option><option>Archived</option></select><button type="submit">Filter</button></form></div>
            <section className="account-recent-projects"><div className="account-section-heading"><h2>{query ? "Matching projects" : params.filter === "Archived" ? "Archived projects" : "All projects"}</h2><span>{visibleProjects.length} projects</span></div><div className="account-project-list">{visibleProjects.map(project => <ProjectRow key={project.id} project={project} customer={customerById.get(project.customer_id ?? "")} />)}{visibleProjects.length === 0 && <div className="account-empty-projects"><strong>{ownProjects.length ? "No matching projects" : "No projects yet"}</strong><p>{ownProjects.length ? "Try another search or status filter." : "Create your first project to start tracking your work."}</p></div>}</div></section>
          </> : view === "customers" ? <>
            <section className="account-page-heading"><div><span className="account-eyebrow">YOUR PEOPLE</span><h1>Customers</h1><p>Keep the people and places behind each job close by.</p></div><details className="account-new-project"><summary className="account-button account-button-primary">Add customer <span aria-hidden="true">＋</span></summary><CustomerForm /></details></section>
            <div className="account-page-toolbar"><form className="account-page-search" action="/"><input type="hidden" name="view" value="customers" /><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder="Search by name or address..." aria-label="Search customers by name or address" /><button type="submit">Search</button></form><form className="account-filter-form"><input type="hidden" name="view" value="customers" /><select name="customer_status" defaultValue={params.customer_status ?? "all"} aria-label="Filter customers by job status"><option value="all">All job statuses</option><option>In Progress</option><option>Planned</option><option>Completed</option><option>No active jobs</option></select><button type="submit">Filter</button></form></div>
            <section className="account-recent-projects"><div className="account-section-heading"><h2>{query ? "Matching customers" : "All customers"}</h2><span>{visibleCustomers.length} customers</span></div><div className="workspace-data-list">{visibleCustomers.map(customer => <CustomerRow key={customer.id} customer={customer} projects={liveProjects} />)}{visibleCustomers.length === 0 && <div className="account-empty-projects"><strong>{ownCustomers.length ? "No matching customers" : "No customers yet"}</strong><p>Customer details you add will appear here.</p></div>}</div></section>
          </> : view === "photos" ? <>
            <section className="account-page-heading"><div><span className="account-eyebrow">VISUAL RECORD</span><h1>Photo library</h1><p>Find the right moment across your project work.</p></div><details className="account-new-project"><summary className="account-button account-button-primary">Upload photos <span>↑</span></summary><form action={uploadProjectPhotos} className="project-create-form account-upload-form"><input type="hidden" name="return_view" value="photos" /><label>Project<select name="project_id" required>{liveProjects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>Category<select name="category" defaultValue="During"><option>Before</option><option>During</option><option>After</option><option>Issue</option><option>Other</option></select></label><label className="account-field-wide">Caption<input name="caption" placeholder="Optional caption; otherwise use filename" /></label><label className="account-field-wide">Choose photos<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required /></label><small>Select multiple images, up to 12 MB each.</small><button className="button button-primary" disabled={!liveProjects.length}>Upload photos</button></form></details></section>
            <div className="account-page-toolbar"><form className="account-page-search" action="/"><input type="hidden" name="view" value="photos" /><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder="Search captions and projects..." aria-label="Search photos" /><button type="submit">Search</button></form><form className="account-filter-form"><input type="hidden" name="view" value="photos" /><select name="category" defaultValue={params.category ?? "all"} aria-label="Filter photos by category"><option value="all">All categories</option><option>Before</option><option>During</option><option>After</option><option>Issue</option><option>Other</option></select><button type="submit">Filter</button></form></div>
            <section className="workspace-photo-grid">{visiblePhotos.map(photo => <article className="workspace-photo-card" key={photo.id}><a href={photoUrlById.get(photo.id) || "#"} target="_blank" rel="noreferrer"><img src={photoUrlById.get(photo.id) || ""} alt={photo.caption || "Project photo"} /><span>{photo.category}</span></a><strong>{photo.caption || "Untitled photo"}</strong><small>{ownProjects.find(project => project.id === photo.project_id)?.name ?? "Project"} · {new Date(photo.taken_at || photo.created_at).toLocaleDateString()}</small><form action={deleteProjectPhoto}><input type="hidden" name="id" value={photo.id} /><input type="hidden" name="project_id" value={photo.project_id} /><ConfirmSubmitButton message="Delete this photo? This cannot be undone.">Delete photo</ConfirmSubmitButton></form></article>)}{visiblePhotos.length === 0 && <div className="account-empty-projects"><strong>{ownPhotos.length ? "No matching photos" : "No photos yet"}</strong><p>Add photos from a project to build your visual record.</p></div>}</section>
          </> : view === "detail" ? <>
            {activeProject ? <>
              {params.error === "comparison" && <div className="account-notice" role="alert">Could not save the comparison. Make sure the latest JobTrace Supabase migration has been applied.</div>}
              {params.error === "photo" && <div className="account-notice" role="alert">Photos could not be uploaded. Check the file type, 12 MB per-photo limit, and Supabase storage setup.</div>}
              <section className="account-page-heading account-detail-heading"><div><span className="account-eyebrow">{activeProject.type.toUpperCase()}</span><h1>{activeProject.name}</h1><p>{customerById.get(activeProject.customer_id ?? "")?.name ?? "No customer"} · {activeProject.property_address || "Address not added"}</p></div><div className="account-detail-actions"><details className="account-new-project"><summary className="account-button">Edit project</summary><ProjectForm project={activeProject} customers={ownCustomers} /></details><form action={setProjectArchived}><input type="hidden" name="id" value={activeProject.id} /><input type="hidden" name="archived" value={String(!activeProject.archived)} /><button className="account-button">{activeProject.archived ? "Restore" : "Archive"}</button></form></div></section>
              <div className="account-project-summary"><span>Status <ProjectStatusSelect id={activeProject.id} status={activeProject.status} /></span><span>Started <strong>{activeProject.start_date || "—"}</strong></span><span>Completed <strong>{activeProject.end_date || "—"}</strong></span></div>
              {activeProject.description && <p className="account-detail-description">{activeProject.description}</p>}
              <nav className="account-detail-tabs"><Link className={selectedTab === "photos" ? "active" : ""} href={`/?view=detail&project=${activeProject.id}&tab=photos`}>Photos ({ownPhotos.filter(photo => photo.project_id === activeProject.id).length})</Link><Link className={selectedTab === "journal" ? "active" : ""} href={`/?view=detail&project=${activeProject.id}&tab=journal`}>Journal ({ownNotes.filter(note => note.project_id === activeProject.id).length})</Link><Link className={selectedTab === "comparison" ? "active" : ""} href={`/?view=detail&project=${activeProject.id}&tab=comparison`}>Before &amp; after</Link></nav>
              {selectedTab === "photos" && <><div className="account-section-heading"><h2>Project photos</h2><div className="account-photo-tools"><form className="account-filter-form"><input type="hidden" name="view" value="detail" /><input type="hidden" name="project" value={activeProject.id} /><input type="hidden" name="tab" value="photos" /><select name="photo_category" defaultValue={selectedPhotoCategory} aria-label="Filter this project's photos"><option value="all">All categories</option><option>Before</option><option>During</option><option>After</option><option>Issue</option><option>Other</option></select><button>Filter</button></form><details className="account-new-project"><summary className="account-button account-button-primary">Add photos <span>↑</span></summary><form action={uploadProjectPhotos} className="project-create-form account-upload-form"><input type="hidden" name="project_id" value={activeProject.id} /><label>Category<select name="category" defaultValue="During"><option>Before</option><option>During</option><option>After</option><option>Issue</option><option>Other</option></select></label><label>Caption<input name="caption" placeholder="Optional caption; otherwise use filename" /></label><label className="account-field-wide">Choose photos<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required /></label><small>Select multiple JPEG, PNG or WebP images, up to 12 MB each.</small><button className="button button-primary">Upload photos</button></form></details></div></div><section className="workspace-photo-grid">{detailPhotos.map(photo => <article className="workspace-photo-card" key={photo.id}><a href={photoUrlById.get(photo.id) || "#"} target="_blank" rel="noreferrer"><img src={photoUrlById.get(photo.id) || ""} alt={photo.caption || "Project photo"} /><span>{photo.category}</span></a><strong>{photo.caption || "Untitled photo"}</strong><form action={deleteProjectPhoto}><input type="hidden" name="id" value={photo.id} /><input type="hidden" name="project_id" value={activeProject.id} /><ConfirmSubmitButton message="Delete this photo? This cannot be undone.">Delete photo</ConfirmSubmitButton></form></article>)}{detailPhotos.length === 0 && <div className="account-empty-projects"><strong>{ownPhotos.some(photo => photo.project_id === activeProject.id) ? "No photos in this category" : "No project photos yet"}</strong><p>Add photos to create a visual record of this job.</p></div>}</section></>}
              {selectedTab === "journal" && <><div className="account-section-heading"><h2>Project journal</h2></div><form action={addProjectNote} className="account-note-form"><input type="hidden" name="project_id" value={activeProject.id} /><label>What happened on this job?<textarea name="body" rows={3} required placeholder="Work completed, conditions found, materials used..." /></label><button className="account-button account-button-primary">Add note</button></form><section className="account-note-list">{ownNotes.filter(note => note.project_id === activeProject.id).map(note => <article key={note.id}><p>{note.body}</p><time>{new Date(note.created_at).toLocaleString()}</time></article>)}{ownNotes.every(note => note.project_id !== activeProject.id) && <p className="account-empty-note">No notes yet. Add the first update above.</p>}</section></>}
              {selectedTab === "comparison" && <><div className="account-section-heading"><h2>Before &amp; after</h2><span>Compare photos from this project.</span></div><form action={savePhotoComparison} className="account-comparison-form"><input type="hidden" name="project_id" value={activeProject.id} /><label>Before photo<select name="before_photo_id" required>{ownPhotos.filter(photo => photo.project_id === activeProject.id && photo.category === "Before").map(photo => <option key={photo.id} value={photo.id}>{photo.caption || photo.category}</option>)}</select></label><label>After photo<select name="after_photo_id" required>{ownPhotos.filter(photo => photo.project_id === activeProject.id && photo.category === "After").map(photo => <option key={photo.id} value={photo.id}>{photo.caption || photo.category}</option>)}</select></label><button className="account-button account-button-primary" disabled={!ownPhotos.some(photo => photo.project_id === activeProject.id && photo.category === "Before") || !ownPhotos.some(photo => photo.project_id === activeProject.id && photo.category === "After")}>Save comparison</button></form>{ownComparisons.filter(comparison => comparison.project_id === activeProject.id).map(comparison => <div className="account-comparison" key={comparison.id}>{[comparison.before_photo_id, comparison.after_photo_id].map(photoId => {const photo = ownPhotos.find(item => item.id === photoId);return photo ? <figure key={photo.id}><img src={photoUrlById.get(photo.id) || ""} alt={photo.caption || photo.category} /><figcaption>{photo.category} · {photo.caption}</figcaption></figure> : null;})}</div>)}</>}
            </> : <div className="account-empty-projects"><strong>Project not found</strong><p>It may have been removed or archived.</p><Link href="/?view=projects">Back to projects</Link></div>}
          </> : <>
          <section className="account-page-heading"><div><span className="account-eyebrow">{workspaceName}</span><h1>Good work starts with a clear record.</h1><p>Here’s what’s happening across your projects today.</p></div></section>
          <div className="account-page-toolbar"><form className="account-page-search" action="/"><input type="hidden" name="view" value="search" /><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder="Search projects, customers..." aria-label="Search projects and customers" /><button type="submit">Search</button></form><details className="account-new-project"><summary className="account-button account-button-primary">New project <span aria-hidden="true">＋</span></summary><ProjectForm customers={ownCustomers} /></details></div>
          {params.error === "workspace" && <div className="account-notice" role="alert">We couldn’t find your workspace. Please sign out and sign in again, or contact support.</div>}
          {params.error === "project" && <div className="account-notice" role="alert">We couldn’t create that project. Please try again.</div>}
          {params.created === "project" && <div className="account-notice" role="status">Project created. You can add customer details and photos as you go.</div>}
          <section className="account-stats-grid" aria-label="Workspace summary">
            <article className="account-stat-card"><div className="account-stat-top">Active projects <span className="account-stat-icon account-stat-blue" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m11.8 3.1 5.1 5.1-2.2 2.2-1.6-1.6-6.8 6.8a1.6 1.6 0 0 1-2.3-2.3l6.8-6.8-1.6-1.6z"/><path d="m9.2 4.4 2.2-2.2 4.6 4.6-2.2 2.2z"/></svg></span></div><div className="account-stat-value">{String(activeCount).padStart(2, "0")}</div><div className="account-stat-note">{liveProjects.length} projects in your workspace</div></article>
            <article className="account-stat-card" id="photos-summary"><div className="account-stat-top">Photos documented <span className="account-stat-icon account-stat-orange" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M3 4.5c2.8-.9 5.1-.7 7 1v11c-1.9-1.7-4.2-1.9-7-1zM17 4.5c-2.8-.9-5.1-.7-7 1v11c1.9-1.7 4.2-1.9 7-1z"/><path d="M5.3 7.2c1.1-.2 2.1-.1 3 .3M11.7 7.5c1-.4 2-.5 3-.3"/></svg></span></div><div className="account-stat-value">{String(photoCount ?? 0).padStart(2, "0")}</div><div className="account-stat-note">Across {liveProjects.length} projects</div></article>
            <article className="account-stat-card"><div className="account-stat-top">Completed jobs <span className="account-stat-icon account-stat-green" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><path d="m6.7 10.1 2.1 2.1 4.6-4.7"/></svg></span></div><div className="account-stat-value">{String(completedCount).padStart(2, "0")}</div><div className="account-stat-note">Ready to look back on</div></article>
            <article className="account-stat-card" id="customers-summary"><div className="account-stat-top">Customers <span className="account-stat-icon account-stat-purple" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="6.2" r="3"/><path d="M4.2 17c.4-3.2 2.5-5 5.8-5s5.4 1.8 5.8 5z"/></svg></span></div><div className="account-stat-value">{String(customerCount ?? 0).padStart(2, "0")}</div><div className="account-stat-note">People behind your projects</div></article>
          </section>
          <div className="account-dashboard-grid">
            <section id="project-list" className="account-recent-projects"><div className="account-section-heading"><h2>{query ? "Matching projects" : "Recent projects"}</h2><a href="#project-list">{ownProjects.length} total</a></div>
              <div className="account-project-list">{visibleProjects.slice(0, 6).map(project => <ProjectRow key={project.id} project={project} customer={customerById.get(project.customer_id ?? "")} />)}
                {visibleProjects.length === 0 && <div className="account-empty-projects"><div className="account-empty-icon" aria-hidden="true">⌂</div><strong>{query ? "No matching projects" : "Your workspace is ready"}</strong><p>{query ? "Try another search term." : "Create your first project to start keeping job details together."}</p>{!query && <ProjectForm />}</div>}
              </div>
            </section>
            <aside className="account-dashboard-aside"><section className="account-activity-panel"><div className="account-section-heading"><h2>Recent activity</h2><span>YOUR WORKSPACE</span></div>
              {ownActivity.length ? ownActivity.slice(0, 5).map(event => <div className="account-activity-item" key={event.id}><span className="account-activity-icon" aria-hidden="true">↗</span><div><strong>{event.message}</strong><time>{new Date(event.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></div></div>) : <div className="account-activity-empty"><span aria-hidden="true">✳</span><p>Your project updates will appear here.</p></div>}
            </section><section className="account-quick-panel"><strong>Capture the details while they’re fresh.</strong><p>Keep a clear record of every job, from the first photo to the final walkthrough.</p><div><Link href="/?view=projects">Projects <span>→</span></Link><Link href="/?view=customers">Customers <span>→</span></Link><Link href="/?view=photos">Photo library <span>→</span></Link></div></section></aside>
          </div>
          </>}
        </div>
      </main>
    </div>;
  }

  return <main className="screen"><section className="panel">
    <div className="brand">jobtrace<span>.</span></div>
    <p className="eyebrow">THE CONTRACTOR WORKSPACE</p>
    <h1>Every job, all in one place.</h1>
    <p>Keep project details, customer information, and job photos close at hand—from your desk or your phone.</p>
    {!supabase && <div className="notice"><strong>Setup in progress</strong><br />Add your Supabase project keys to <code>.env.local</code> to enable sign-in.</div>}
    <Link className="button primary" href="/login">Sign in or create an account <span aria-hidden="true">→</span></Link>
    <a className="text-link" href="/prototype/index.html">Preview the current demo</a>
    <p className="footnote">The demo stores its sample data only in this browser. Use a deployed account for cross-device access.</p>
  </section></main>;
}
