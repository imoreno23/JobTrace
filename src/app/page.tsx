import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null };

  if (data?.claims) {
    return <main className="screen"><section className="panel"><div className="brand">jobtrace<span>.</span></div><p className="eyebrow">YOUR WORKSPACE</p><h1>You’re signed in.</h1><p>Your account is ready. The next setup step is connecting the project and customer records to Supabase.</p><Link className="button primary" href="/prototype/index.html">Open the current app preview</Link></section></main>;
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
