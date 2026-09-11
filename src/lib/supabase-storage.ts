import { createClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "stock-images";

export function getStorageClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_REST_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase configuration. Please ensure SUPABASE_URL and a Supabase API key are set in .env"
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Uploads a file buffer/blob to the Supabase Storage bucket for a specific stock item.
 */
export async function uploadStockImage({
  fileBuffer,
  fileName,
  contentType,
  stockItemId,
}: {
  fileBuffer: Buffer | Uint8Array;
  fileName: string;
  contentType: string;
  stockItemId: string;
}): Promise<{ imageUrl: string; storagePath: string }> {
  const supabase = getStorageClient();

  // Sanitize file name and create a unique path
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `items/${stockItemId}/${uniquePrefix}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: contentType || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload to storage: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return {
    imageUrl: urlData.publicUrl,
    storagePath,
  };
}

/**
 * Deletes a file from Supabase storage by path.
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.warn(`Could not delete storage file ${storagePath}:`, error.message);
  }
}
