import { createClientSupabaseClient } from "@/shared/config/auth";

export class SupabaseStorageError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "SupabaseStorageError";
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
  options: {
    upsert?: boolean;
    cacheControl?: string;
  } = {}
): Promise<{ url: string; path: string }> {
  const supabase = createClientSupabaseClient();

  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: options.cacheControl || "3600",
        upsert: options.upsert || false,
      });

    if (error) {
      throw new SupabaseStorageError(error.message, error.name);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError("Failed to upload file");
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createClientSupabaseClient();

  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new SupabaseStorageError(error.message, error.name);
    }
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw error;
    }
    throw new SupabaseStorageError("Failed to delete file");
  }
}

/**
 * Generate a unique file path for student passport photos
 */
export function generatePassportPhotoPath(
  studentId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const extension = fileName.split(".").pop();
  return `passport-photos/${studentId}/${timestamp}.${extension}`;
}

/**
 * Upload student passport photo
 */
export async function uploadPassportPhoto(
  file: File,
  studentId: string
): Promise<string> {
  const path = generatePassportPhotoPath(studentId, file.name);

  try {
    const { url } = await uploadFile(file, "student-documents", path, {
      upsert: true,
      cacheControl: "31536000", // 1 year cache
    });

    return url;
  } catch (error) {
    if (error instanceof SupabaseStorageError) {
      throw new Error(`Failed to upload passport photo: ${error.message}`);
    }
    throw new Error("Failed to upload passport photo");
  }
}

/**
 * Delete student passport photo
 */
export async function deletePassportPhoto(photoUrl: string): Promise<void> {
  if (!photoUrl) return;

  try {
    // Extract path from URL
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.findIndex(
      (part) => part === "student-documents"
    );

    if (bucketIndex === -1) {
      throw new Error("Invalid photo URL format");
    }

    const path = pathParts.slice(bucketIndex + 1).join("/");
    await deleteFile("student-documents", path);
  } catch (error) {
    // Don't throw error for deletion failures, just log
    console.warn("Failed to delete passport photo:", error);
  }
}
