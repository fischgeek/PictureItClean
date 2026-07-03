import "../db";
import { repos } from "../repositories";
import { hashPassword } from "../services/auth";

async function main() {
  const [username, password, ...rest] = process.argv.slice(2);
  const displayName = rest.join(" ") || username;

  if (!username || !password) {
    console.error("Usage: npm run create-user --workspace apps/server -- <username> <password> [display name]");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("Password must be at least 6 characters");
    process.exit(1);
  }
  if (repos.users.findByUsername(username)) {
    console.error(`Username "${username}" already exists`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = repos.users.create({ username, passwordHash, displayName });
  console.log(`Created user "${user.username}" (${user.displayName})`);
}

main();
