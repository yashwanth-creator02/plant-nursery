import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function testStorage() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_REST_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  console.log("Checking Environment Variables:");
  console.log("SUPABASE_URL:", supabaseUrl ? "Found" : "MISSING");
  console.log("SUPABASE_SERVICE_ROLE_KEY / SECRET_KEY:", (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY) ? "Found" : "Not set");
  console.log("SUPABASE_ANON_KEY / PUBLISHABLE_KEY:", (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY) ? "Found" : "Not set");

  if (!supabaseUrl || !supabaseKey) {
    console.error("\nError: Missing SUPABASE_URL or Supabase API Key in .env!");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const bucketName = "stock-images";

  console.log(`\nTesting connection to bucket "${bucketName}"...`);

  // 1. List buckets to verify connection
  const { data: buckets, error: listBucketsErr } = await supabase.storage.listBuckets();
  if (listBucketsErr) {
    console.error("Failed to list buckets:", listBucketsErr.message);
  } else {
    console.log("Buckets found in project:", buckets.map((b) => b.name).join(", "));
  }

  // 2. Upload a small test file
  const testFileName = `test-${Date.now()}.txt`;
  const testContent = "Hello from Supabase Storage test!";
  console.log(`\nAttempting to upload "${testFileName}" to "${bucketName}"...`);

  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from(bucketName)
    .upload(testFileName, Buffer.from(testContent), {
      contentType: "text/plain",
      upsert: true,
    });

  if (uploadErr) {
    console.error("Upload failed:", uploadErr.message);
    process.exit(1);
  }

  console.log("Upload successful:", uploadData);

  // 3. Get Public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(testFileName);

  console.log("Public URL:", publicUrlData.publicUrl);

  // 4. Clean up test file
  console.log(`\nCleaning up test file "${testFileName}"...`);
  const { error: removeErr } = await supabase.storage
    .from(bucketName)
    .remove([testFileName]);

  if (removeErr) {
    console.error("Failed to remove test file:", removeErr.message);
  } else {
    console.log("Test file cleaned up successfully!");
  }

  console.log("\nAll Storage tests passed!");
}

testStorage().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
