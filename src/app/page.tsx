import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProject, signOut } from "./actions";
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

type Customer = { id: string; name: string };
type Props = { searchParams: Promise<{ created?: string; error?: string; q?: string }> };

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
      supabase.from("customers").select("id, name", { count: "exact" }),
      supabase.from("project_photos").select("id", { count: "exact", head: true }),
    ]);
    const ownProjects = (projects ?? []) as Project[];
    const ownCustomers = (customers ?? []) as Customer[];
    const customerById = new Map(ownCustomers.map(customer => [customer.id, customer]));
    const activeCount = ownProjects.filter(project => project.status === "In Progress").length;
    const completedCount = ownProjects.filter(project => project.status === "Completed").length;
    const email = typeof data.claims.email === "string" ? data.claims.email : "JobTrace user";
    const query = params.q?.trim().toLowerCase() ?? "";
    const visibleProjects = ownProjects.filter(project => !query || `${project.name} ${project.type} ${project.property_address} ${customerById.get(project.customer_id ?? "")?.name ?? ""}`.toLowerCase().includes(query));

    return <div className="account-app-shell">
      <WorkspaceMenu email={email} projectCount={ownProjects.length} />
      <main className="account-main-area">
        <header className="account-topbar">
          <div className="account-breadcrumb"><span>Workspace</span><span className="account-crumb-slash">/</span><strong>Home</strong></div>
          <div className="account-topbar-actions">
            <form className="account-global-search" action="/"><span aria-hidden="true">⌕</span><input name="q" type="search" defaultValue={params.q ?? ""} placeholder="Search projects, customers..." aria-label="Search projects and customers" /><button type="submit" aria-label="Search">↵</button></form>
            <form action={signOut}><button className="account-signout" type="submit">Sign out</button></form>
            <div className="account-top-avatar" aria-label={email}>{email.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        <div className="account-page-content" id="workspace-home">
          <section className="account-page-heading"><div><span className="account-eyebrow">{business?.name ?? "YOUR WORKSPACE"}</span><h1>Good work starts with a clear record.</h1><p>Here’s what’s happening across your projects today.</p></div><details className="account-new-project"><summary className="account-button account-button-primary">New project <span aria-hidden="true">＋</span></summary><ProjectForm /></details></section>
          {params.error === "workspace" && <div className="account-notice" role="alert">We couldn’t find your workspace. Please sign out and sign in again, or contact support.</div>}
          {params.error === "project" && <div className="account-notice" role="alert">We couldn’t create that project. Please try again.</div>}
          {params.created === "project" && <div className="account-notice" role="status">Project created. You can add customer details and photos as you go.</div>}
          <section className="account-stats-grid" aria-label="Workspace summary">
            <article className="account-stat-card"><div className="account-stat-top">Active projects <span className="account-stat-icon account-stat-blue" aria-hidden="true">⚒</span></div><div className="account-stat-value">{String(activeCount).padStart(2, "0")}</div><div className="account-stat-note">{ownProjects.length} projects in your workspace</div></article>
            <article className="account-stat-card" id="photos-summary"><div className="account-stat-top">Photos documented <span className="account-stat-icon account-stat-orange" aria-hidden="true">▤</span></div><div className="account-stat-value">{String(photoCount ?? 0).padStart(2, "0")}</div><div className="account-stat-note">Across {ownProjects.length} projects</div></article>
            <article className="account-stat-card"><div className="account-stat-top">Completed jobs <span className="account-stat-icon account-stat-green" aria-hidden="true">✓</span></div><div className="account-stat-value">{String(completedCount).padStart(2, "0")}</div><div className="account-stat-note">Ready to look back on</div></article>
            <article className="account-stat-card" id="customers-summary"><div className="account-stat-top">Customers <span className="account-stat-icon account-stat-purple" aria-hidden="true">♙</span></div><div className="account-stat-value">{String(customerCount ?? 0).padStart(2, "0")}</div><div className="account-stat-note">People behind your projects</div></article>
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
