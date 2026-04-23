import { createClient } from "@/lib/supabase/server";

export async function uploadToStorage(
  file: File,
  orgId: string,
  patientId: string
): Promise<string> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const filePath = `${orgId}/${patientId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Storage upload failed");
  return filePath;
}

export async function generateSignedUrl(filePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 3600);
  if (error || !data?.signedUrl) throw new Error("Could not generate signed URL");
  return data.signedUrl;
}

export async function deleteFromStorage(filePath: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from("documents").remove([filePath]);
  if (error) throw new Error("Storage deletion failed");
}
