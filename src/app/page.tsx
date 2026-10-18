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
};

type Props = { searchParams: Promise<{ created?: string; error?: string }> };

function ProjectForm() {
  return <form action={createProject} className="project-create-form">
    <label>Project name<input name="name" required maxLength={120} placeholder="e.g. Oak Street bathroom remodel" /></label>
    <label>Project type<select name="type" defaultValue="Bathroom remodel">
      <option>Bathroom remodel</option><option>Kitchen remodel</option><option>Repair</option><option>Painting</option><option>Carpentry</option><option>Electrical</option><option>Plumbing</option><option>Other</option>
    </select></label>
    <button className="button primary" type="submit">Create project <span aria-hidden="true">→</span></button>
  </form>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null };

  if (data?.claims && supabase) {
    const [{ data: business }, { data: projects }, { count: customerCount }, { count: photoCount }] = await Promise.all([
      supabase.from("businesses").select("id, name").maybeSingle(),
      supabase.from("projects").select("id, name, type, status, property_address, created_at").eq("archived", false).order("created_at", { ascending: false }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("project_photos").select("id", { count: "exact", head: true }),
    ]);
    const ownProjects = (projects ?? []) as Project[];
    const activeCount = ownProjects.filter(project => project.status === "In Progress").length;
    const greeting = typeof data.claims.email === "string" ? data.claims.email : "your workspace";

    return <main className="workspace-screen">
      <header className="workspace-topbar">
        <WorkspaceMenu />
        <Link className="brand" href="/">jobtrace<span>.</span></Link>
        <div className="workspace-account"><span>{greeting}</span><form action={signOut}><button type="submit">Sign out</button></form></div>
      </header>
      <div className="workspace-content" id="workspace-home">
        <section className="workspace-heading"><div><p className="eyebrow">{business?.name ?? "YOUR WORKSPACE"}</p><h1>Good work starts here.</h1><p>Your projects, customers, and job photos will live here.</p></div></section>
        {params.error === "workspace" && <div className="notice error" role="alert">We couldn’t find your workspace. Please sign out and sign in again, or contact support.</div>}
        {params.error === "project" && <div className="notice error" role="alert">We couldn’t create that project. Please try again.</div>}
        {params.created === "project" && <div className="notice" role="status">Project created. You can add its customer details and photos as you go.</div>}
        <section className="workspace-stats" aria-label="Workspace summary">
          <article><span>Active projects</span><strong>{String(activeCount).padStart(2, "0")}</strong></article>
          <article><span>All projects</span><strong>{String(ownProjects.length).padStart(2, "0")}</strong></article>
          <article><span>Customers</span><strong>{String(customerCount ?? 0).padStart(2, "0")}</strong></article>
          <article><span>Project photos</span><strong>{String(photoCount ?? 0).padStart(2, "0")}</strong></article>
        </section>
        {ownProjects.length === 0 ? <section className="workspace-empty" id="workspace-projects">
          <div className="empty-mark" aria-hidden="true">⌂</div>
          <p className="eyebrow">A FRESH START</p><h2>Your first project starts here.</h2>
          <p>Create a project to keep its job details and photos together. This workspace is yours—there’s no sample data to clear out.</p>
          <ProjectForm />
        </section> : <section className="workspace-projects" id="workspace-projects">
          <div className="workspace-section-heading"><div><p className="eyebrow">YOUR WORK</p><h2>Projects</h2></div><details className="new-project-details"><summary>＋ New project</summary><ProjectForm /></details></div>
          <div className="workspace-project-list">{ownProjects.map(project => <article className="workspace-project" key={project.id}>
            <div className="project-mark" aria-hidden="true">⌂</div><div className="workspace-project-copy"><h3>{project.name}</h3><p>{project.type}{project.property_address ? ` · ${project.property_address}` : ""}</p></div>
            <span className={`workspace-status status-${project.status.toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span>
          </article>)}</div>
        </section>}
      </div>
    </main>;
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
