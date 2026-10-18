"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;
async function logWorkspaceActivity(supabase: SupabaseClient, businessId: string, message: string) {
  await supabase.from("workspace_activity").insert({ business_id: businessId, message });
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=setup");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "Other");
  const status = String(formData.get("status") ?? "Planned");
  const allowedTypes = new Set(["Bathroom remodel", "Kitchen remodel", "Repair", "Painting", "Carpentry", "Electrical", "Plumbing", "Other"]);
  if (!name || name.length > 120 || !allowedTypes.has(type) || !["Planned", "In Progress", "Completed"].includes(status)) redirect("/?error=project");

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").maybeSingle();
  if (!business) redirect("/?error=workspace");

  const { data: project, error } = await supabase.from("projects").insert({
    business_id: business.id,
    name,
    type,
    status,
    customer_id: String(formData.get("customer_id") ?? "") || null,
    property_address: String(formData.get("property_address") ?? "").trim(),
    start_date: String(formData.get("start_date") ?? "") || null,
    end_date: String(formData.get("end_date") ?? "") || null,
    description: String(formData.get("description") ?? "").trim(),
  }).select("id").single();
  if (error) redirect("/?error=project");
  await logWorkspaceActivity(supabase, business.id, `Created project ${name}.`);

  revalidatePath("/");
  redirect(`/?view=detail&project=${project.id}`);
}

async function getWorkspace() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=setup");
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").maybeSingle();
  if (!business) redirect("/?error=workspace");
  return { supabase, business };
}

export async function updateProject(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "Other");
  const status = String(formData.get("status") ?? "Planned");
  if (!id || !name || name.length > 120 || !["Bathroom remodel", "Kitchen remodel", "Repair", "Painting", "Carpentry", "Electrical", "Plumbing", "Other"].includes(type) || !["Planned", "In Progress", "Completed"].includes(status)) redirect("/?view=projects&error=project");
  await supabase.from("projects").update({
    name, type, status, customer_id: String(formData.get("customer_id") ?? "") || null,
    property_address: String(formData.get("property_address") ?? "").trim(),
    start_date: String(formData.get("start_date") ?? "") || null,
    end_date: String(formData.get("end_date") ?? "") || null,
    description: String(formData.get("description") ?? "").trim(),
  }).eq("id", id);
  await logWorkspaceActivity(supabase, business.id, `Updated project ${name}.`);
  revalidatePath("/");
  redirect(`/?view=detail&project=${id}`);
}

export async function updateProjectStatus(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id && ["Planned", "In Progress", "Completed"].includes(status)) {
    const { data: project } = await supabase.from("projects").update({ status }).eq("id", id).select("name").maybeSingle();
    if (project) await logWorkspaceActivity(supabase, business.id, `Changed ${project.name} to ${status}.`);
  }
  revalidatePath("/");
}

export async function setProjectArchived(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "true") === "true";
  if (id) {
    const { data: project } = await supabase.from("projects").update({ archived }).eq("id", id).select("name").maybeSingle();
    if (project) await logWorkspaceActivity(supabase, business.id, `${archived ? "Archived" : "Restored"} project ${project.name}.`);
  }
  revalidatePath("/");
  redirect(`/?view=${archived ? "projects" : "detail"}&project=${id}`);
}

export async function saveCustomer(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 120) redirect("/?view=customers&error=customer");
  const values = { name, email: String(formData.get("email") ?? "").trim() || null, phone: String(formData.get("phone") ?? "").trim() || null, address: String(formData.get("address") ?? "").trim() || null, notes: String(formData.get("notes") ?? "").trim() };
  if (id) await supabase.from("customers").update(values).eq("id", id);
  else await supabase.from("customers").insert({ ...values, business_id: business.id });
  await logWorkspaceActivity(supabase, business.id, `${id ? "Updated" : "Added"} customer ${name}.`);
  revalidatePath("/");
  redirect("/?view=customers");
}

export async function addProjectNote(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const projectId = String(formData.get("project_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (projectId && body) {
    await supabase.from("project_notes").insert({ business_id: business.id, project_id: projectId, body });
    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
    await logWorkspaceActivity(supabase, business.id, `Added a journal note to ${project?.name ?? "a project"}.`);
  }
  revalidatePath("/");
  redirect(`/?view=detail&project=${projectId}&tab=journal`);
}

export async function uploadProjectPhotos(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const projectId = String(formData.get("project_id") ?? "");
  const category = String(formData.get("category") ?? "During");
  const caption = String(formData.get("caption") ?? "").trim();
  const returnView = String(formData.get("return_view") ?? "detail");
  const files = formData.getAll("photos").filter((value): value is File => typeof value !== "string" && value.size > 0);
  if (!projectId || !files.length || !["Before", "During", "After", "Issue", "Other"].includes(category)) redirect(`/?view=detail&project=${projectId}&error=photo`);
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
  let saved = 0;
  let failure: "type" | "size" | "storage" | "record" | null = null;
  for (const file of files) {
    if (!allowedTypes.has(file.type)) { failure ??= "type"; continue; }
    if (file.size > 12 * 1024 * 1024) { failure ??= "size"; continue; }
    const extension = file.name.split(".").pop()?.toLowerCase() || (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/heic" ? "heic" : file.type === "image/heif" ? "heif" : "jpg");
    const path = `${projectId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("project-photos").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) { console.error("Project photo storage upload failed:", uploadError.message); failure ??= "storage"; continue; }
    const { error: rowError } = await supabase.from("project_photos").insert({ business_id: business.id, project_id: projectId, object_path: path, category, caption: caption || file.name.replace(/\.[^.]+$/, ""), taken_at: String(formData.get("taken_at") ?? "") || null });
    if (rowError) { console.error("Project photo record insert failed:", rowError.message); await supabase.storage.from("project-photos").remove([path]); failure ??= "record"; }
    else saved++;
  }
  if (saved) {
    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
    await logWorkspaceActivity(supabase, business.id, `Added ${saved} photo${saved === 1 ? "" : "s"} to ${project?.name ?? "a project"}.`);
  }
  revalidatePath("/");
  const destination = returnView === "photos" ? "?view=photos" : `?view=detail&project=${projectId}&tab=photos`;
  redirect(`/${destination}${saved ? "&uploaded=" + saved : ""}${failure ? "&error=photo&reason=" + failure : saved ? "" : "&error=photo"}`);
}

export async function deleteProjectPhoto(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("project_id") ?? "");
  const { data: photo } = await supabase.from("project_photos").select("object_path").eq("id", id).maybeSingle();
  if (photo) {
    await supabase.storage.from("project-photos").remove([photo.object_path]);
    await supabase.from("project_photos").delete().eq("id", id);
    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
    await logWorkspaceActivity(supabase, business.id, `Deleted a photo from ${project?.name ?? "a project"}.`);
  }
  revalidatePath("/");
  redirect(`/?view=detail&project=${projectId}&tab=photos`);
}

export async function savePhotoComparison(formData: FormData) {
  const { supabase, business } = await getWorkspace();
  const projectId = String(formData.get("project_id") ?? "");
  const beforeId = String(formData.get("before_photo_id") ?? "");
  const afterId = String(formData.get("after_photo_id") ?? "");
  if (projectId && beforeId && afterId && beforeId !== afterId) {
    const { error } = await supabase.from("project_photo_comparisons").upsert({ business_id: business.id, project_id: projectId, before_photo_id: beforeId, after_photo_id: afterId }, { onConflict: "project_id" });
    if (error) redirect(`/?view=detail&project=${projectId}&tab=comparison&error=comparison`);
    const { data: project } = await supabase.from("projects").select("name").eq("id", projectId).maybeSingle();
    await logWorkspaceActivity(supabase, business.id, `Saved a before-and-after comparison for ${project?.name ?? "a project"}.`);
  }
  revalidatePath("/");
  redirect(`/?view=detail&project=${projectId}&tab=comparison`);
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
