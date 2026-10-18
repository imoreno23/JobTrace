import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "./actions";
import AccountMenu from "./account-menu";
import WorkspaceMenu from "./workspace-menu";

type Project = {
  id: string;
  name: string;
  type: string;
  status: "Planned" | "In Progress" | "Completed";
  property_address: string;
  created_at: string;
  customer_id: string | null;
};

type Customer = { id: string; name: string; email: string | null; phone: string | null; address: string | null };
type Photo = { id: string; project_id: string; object_path: string; category: string; caption: string; created_at: string };
type View = "home" | "projects" | "customers" | "photos";
type Props = { searchParams: Promise<{ created?: string; error?: string; q?: string; view?: string }> };

function ProjectForm() {
  return <form action={createProject} className="project-create-form">
    <label>Project name<input name="name" required maxLength={120} placeholder="e.g. Oak Street bathroom remodel" /></label>
    <label>Project type<select name="type" defaultValue="Bathroom remodel">
      <option>Bathroom remodel</option><option>Kitchen remodel</option><option>Repair</option><option>Painting</option><option>Carpentry</option><option>Electrical</option><option>Plumbing</option><option>Other</option>
    </select></label>
    <button className="button button-primary" type="submit">Create project <span aria-hidden="true">→</span></button>
  </form>;
}

function ProjectRow({ project, customer }: { project: Project; customer?: Customer }) {
  const statusClass = project.status === "Completed" ? "completed" : project.status === "Planned" ? "planned" : "progress";
  return <article className="account-project-row">
    <div className="account-project-thumb" aria-hidden="true"><span>⌂</span></div>
    <div className="account-project-main"><strong>{project.name}</strong><span>{project.type}</span></div>
    <div className="account-project-customer">{customer?.name ?? "No customer"}</div>
    <span className={`account-project-status status-${statusClass}`}>{project.status}</span>
    <span className="account-project-arrow" aria-hidden="true">›</span>
  </article>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null };

  if (data?.claims && supabase) {
    const [{ data: business }, { data: projects }, { data: customers, count: customerCount }, { count: photoCount }] = await Promise.all([
      supabase.from("businesses").select("id, name").maybeSingle(),
      supabase.from("projects").select("id, name, type, status, property_address, created_at, customer_id").eq("archived", false).order("created_at", { ascending: false }),
      supabase.from("customers").select("id, name, email, phone, address", { count: "exact" }).order("name"),
      supabase.from("project_photos").select("id", { count: "exact", head: true }),
    ]);
    const { data: photos } = await supabase.from("project_photos").select("id, project_id, object_path, category, caption, created_at").order("created_at", { ascending: false });
    const ownProjects = (projects ?? []) as Project[];
    const ownCustomers = (customers ?? []) as Customer[];
    const customerById = new Map(ownCustomers.map(customer => [customer.id, customer]));
    const activeCount = ownProjects.filter(project => project.status === "In Progress").length;
    const completedCount = ownProjects.filter(project => project.status === "Completed").length;
    const email = typeof data.claims.email === "string" ? data.claims.email : "JobTrace user";
    const workspaceName = business?.name ?? "My Business";
    const view: View = params.view === "projects" || params.view === "customers" || params.view === "photos" ? params.view : "home";
    const query = params.q?.trim().toLowerCase() ?? "";
    const visibleProjects = ownProjects.filter(project => !query || `${project.name} ${project.type} ${project.property_address} ${customerById.get(project.customer_id ?? "")?.name ?? ""}`.toLowerCase().includes(query));
    const ownPhotos = (photos ?? []) as Photo[];
    const visibleCustomers = ownCustomers.filter(customer => !query || `${customer.name} ${customer.email ?? ""} ${customer.phone ?? ""} ${customer.address ?? ""}`.toLowerCase().includes(query));
    const visiblePhotos = ownPhotos.filter(photo => !query || `${photo.caption} ${photo.category} ${photo.object_path} ${ownProjects.find(project => project.id === photo.project_id)?.name ?? ""}`.toLowerCase().includes(query));
    const pageTitle = view === "home" ? "Home" : view === "projects" ? "Projects" : view === "customers" ? "Customers" : "Photo library";

    return <div className="account-app-shell">
      <WorkspaceMenu email={email} projectCount={ownProjects.length} view={view} />
      <main className="account-main-area">
        <header className="account-topbar">
          <div className="account-breadcrumb"><span>Workspace</span><span className="account-crumb-slash">/</span><strong>{pageTitle}</strong></div>
          <AccountMenu email={email} workspaceName={workspaceName} />
        </header>
        <div className="account-page-content" id="workspace-home">
          {view !== "home" ? <>
            <section className="account-page-heading"><div><span className="account-eyebrow">{workspaceName}</span><h1>{pageTitle}</h1><p>{view === "projects" ? "All of your active and completed jobs in one place." : view === "customers" ? "The people and contact details connected to your work." : "Photos saved across your projects."}</p></div></section>
            <div className="account-page-toolbar"><form className="account-page-search" action="/"><input type="hidden" name="view" value={view} /><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder={`Search ${view === "photos" ? "photos" : view}...`} aria-label={`Search ${pageTitle.toLowerCase()}`} /><button type="submit">Search</button></form>{view === "projects" && <details className="account-new-project"><summary className="account-button account-button-primary">New project <span aria-hidden="true">＋</span></summary><ProjectForm /></details>}</div>
            {view === "projects" && <section className="account-recent-projects"><div className="account-section-heading"><h2>{query ? "Matching projects" : "All projects"}</h2><span>{visibleProjects.length} projects</span></div><div className="account-project-list">{visibleProjects.map(project => <ProjectRow key={project.id} project={project} customer={customerById.get(project.customer_id ?? "")} />)}{visibleProjects.length === 0 && <div className="account-empty-projects"><strong>{ownProjects.length ? "No matching projects" : "No projects yet"}</strong><p>{ownProjects.length ? "Try another search." : "Create your first project to start tracking your work."}</p></div>}</div></section>}
            {view === "customers" && <section className="account-recent-projects"><div className="account-section-heading"><h2>{query ? "Matching customers" : "All customers"}</h2><span>{visibleCustomers.length} customers</span></div><div className="workspace-data-list">{visibleCustomers.map(customer => <article className="workspace-data-row" key={customer.id}><div className="workspace-data-avatar" aria-hidden="true">{customer.name.slice(0, 1).toUpperCase()}</div><div><strong>{customer.name}</strong><span>{customer.email || customer.phone || "No contact details"}</span></div><span>{customer.address || "Address not added"}</span></article>)}{visibleCustomers.length === 0 && <div className="account-empty-projects"><strong>{ownCustomers.length ? "No matching customers" : "No customers yet"}</strong><p>Customer details will appear here when added to a project.</p></div>}</div></section>}
            {view === "photos" && <section className="account-recent-projects"><div className="account-section-heading"><h2>{query ? "Matching photos" : "Recent photos"}</h2><span>{visiblePhotos.length} photos</span></div><div className="workspace-data-list">{visiblePhotos.map(photo => <article className="workspace-data-row" key={photo.id}><div className="workspace-photo-placeholder" aria-hidden="true">▧</div><div><strong>{photo.caption || photo.category}</strong><span>{ownProjects.find(project => project.id === photo.project_id)?.name ?? "Project"}</span></div><span>{photo.category}</span></article>)}{visiblePhotos.length === 0 && <div className="account-empty-projects"><strong>{ownPhotos.length ? "No matching photos" : "No photos yet"}</strong><p>Photos added to your projects will appear here.</p></div>}</div></section>}
          </> : <>
          <section className="account-page-heading"><div><span className="account-eyebrow">{workspaceName}</span><h1>Good work starts with a clear record.</h1><p>Here’s what’s happening across your projects today.</p></div></section>
          <div className="account-page-toolbar"><form className="account-page-search" action="/"><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder="Search projects, customers..." aria-label="Search projects and customers" /><button type="submit">Search</button></form><details className="account-new-project"><summary className="account-button account-button-primary">New project <span aria-hidden="true">＋</span></summary><ProjectForm /></details></div>
          {params.error === "workspace" && <div className="account-notice" role="alert">We couldn’t find your workspace. Please sign out and sign in again, or contact support.</div>}
          {params.error === "project" && <div className="account-notice" role="alert">We couldn’t create that project. Please try again.</div>}
          {params.created === "project" && <div className="account-notice" role="status">Project created. You can add customer details and photos as you go.</div>}
          <section className="account-stats-grid" aria-label="Workspace summary">
            <article className="account-stat-card"><div className="account-stat-top">Active projects <span className="account-stat-icon account-stat-blue" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="m11.8 3.1 5.1 5.1-2.2 2.2-1.6-1.6-6.8 6.8a1.6 1.6 0 0 1-2.3-2.3l6.8-6.8-1.6-1.6z"/><path d="m9.2 4.4 2.2-2.2 4.6 4.6-2.2 2.2z"/></svg></span></div><div className="account-stat-value">{String(activeCount).padStart(2, "0")}</div><div className="account-stat-note">{ownProjects.length} projects in your workspace</div></article>
            <article className="account-stat-card" id="photos-summary"><div className="account-stat-top">Photos documented <span className="account-stat-icon account-stat-orange" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M3 4.5c2.8-.9 5.1-.7 7 1v11c-1.9-1.7-4.2-1.9-7-1zM17 4.5c-2.8-.9-5.1-.7-7 1v11c1.9-1.7 4.2-1.9 7-1z"/><path d="M5.3 7.2c1.1-.2 2.1-.1 3 .3M11.7 7.5c1-.4 2-.5 3-.3"/></svg></span></div><div className="account-stat-value">{String(photoCount ?? 0).padStart(2, "0")}</div><div className="account-stat-note">Across {ownProjects.length} projects</div></article>
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
              {ownProjects.length ? ownProjects.slice(0, 4).map(project => <div className="account-activity-item" key={project.id}><span className="account-activity-icon" aria-hidden="true">↗</span><div><strong>{project.name}</strong><p>Project · {project.status}</p><time>{new Date(project.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></div></div>) : <div className="account-activity-empty"><span aria-hidden="true">✳</span><p>Your project updates will appear here.</p></div>}
            </section><section className="account-quick-panel"><strong>Capture the details while they’re fresh.</strong><p>Keep a clear record of every job, from the first photo to the final walkthrough.</p><div><a href="#project-list">Projects <span>→</span></a><a href="#customers-summary">Customers <span>→</span></a></div></section></aside>
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
