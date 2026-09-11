import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { uploadUserSignature, deleteUserSignature } from "../src/lib/supabase-storage";

async function main() {
  console.log("Testing Digital Signature Cloud Storage & DB Association...");

  // 1. Get a user
  const [user] = await db.select().from(users).limit(1);
  if (!user) {
    throw new Error("No user found in database to test signature on.");
  }
  console.log(`Testing with user: ${user.username} (${user.id})`);
  const originalSignature = user.signature;

  // 2. Create a minimal 1x1 transparent PNG buffer
  const samplePngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const buffer = Buffer.from(samplePngBase64, "base64");

  // 3. Upload to Supabase Storage
  console.log("Uploading test signature to Supabase Storage...");
  const { imageUrl, storagePath } = await uploadUserSignature({
    userId: user.id,
    fileBuffer: buffer,
    contentType: "image/png",
  });
  console.log("Uploaded successfully!");
  console.log("Storage Path:", storagePath);
  console.log("Public URL:", imageUrl);

  // 4. Update user in database
  console.log("Updating user signature in Postgres database...");
  await db
    .update(users)
    .set({ signature: imageUrl })
    .where(eq(users.id, user.id));

  // 5. Query user back to verify
  const [updatedUser] = await db
    .select({ id: users.id, signature: users.signature })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!updatedUser || updatedUser.signature !== imageUrl) {
    throw new Error("User signature in DB did not match the uploaded public URL!");
  }
  console.log("Verified: User record in DB contains the cloud signature URL!");

  // 6. Test typed signature format as well
  console.log("Testing typed signature format (text:John Doe)...");
  await db
    .update(users)
    .set({ signature: "text:S. V. Lakshmi" })
    .where(eq(users.id, user.id));

  const [typedUser] = await db
    .select({ signature: users.signature })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (typedUser?.signature !== "text:S. V. Lakshmi") {
    throw new Error("Typed signature test failed!");
  }
  console.log("Verified: Typed signature stored correctly!");

  // 7. Cleanup test signature in Supabase and restore original
  console.log("Cleaning up test file from Supabase Storage and restoring original user signature...");
  await deleteUserSignature(user.id);
  await db
    .update(users)
    .set({ signature: originalSignature })
    .where(eq(users.id, user.id));

  console.log("\nAll Digital Signature Cloud Storage tests passed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
