import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Storage bucket for student files
export const STORAGE_BUCKETS = {
  STUDENT_PHOTOS: "student-photos",
  DOCUMENTS: "documents",
} as const;

// Helper function to upload passport photo
export async function uploadPassportPhoto(
  file: File,
  studentId: string
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${studentId}/passport.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.STUDENT_PHOTOS)
    .upload(fileName, file, {
      upsert: true, // Replace if exists
    });

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.STUDENT_PHOTOS)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
