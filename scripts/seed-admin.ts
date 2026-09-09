/**
 * Creates the first admin user. Run once after setting up your database:
 *
 *   npx tsx scripts/seed-admin.ts <username> <password>
 *
 * Example:
 *   npx tsx scripts/seed-admin.ts admin "correct-horse-battery-staple"
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const [username, password] = process.argv.slice(2);

  if (!username || !password) {
    console.error("Usage: npx tsx scripts/seed-admin.ts <username> <password>");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({ username: username.toLowerCase(), passwordHash, role: "admin" })
    .onConflictDoNothing({ target: users.username })
    .returning({ id: users.id, username: users.username });

  if (!user) {
    console.error(
      `A user named "${username}" already exists — pick a different username, or delete the existing row first.`
    );
    process.exit(1);
  }

  console.log(`✅ Admin user "${user.username}" created.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
