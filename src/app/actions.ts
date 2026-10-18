"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=setup");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "Other");
  const allowedTypes = new Set(["Bathroom remodel", "Kitchen remodel", "Repair", "Painting", "Carpentry", "Electrical", "Plumbing", "Other"]);
  if (!name || name.length > 120 || !allowedTypes.has(type)) redirect("/?error=project");

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").maybeSingle();
  if (!business) redirect("/?error=workspace");

  const { error } = await supabase.from("projects").insert({
    business_id: business.id,
    name,
    type,
    status: "Planned",
  });
  if (error) redirect("/?error=project");

  revalidatePath("/");
  redirect("/?created=project");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
