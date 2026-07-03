import "../db";
import { repos } from "../repositories";
import { hashPassword } from "../services/auth";

async function main() {
  const rawArgs = process.argv.slice(2);
  const adminFlagIndex = rawArgs.indexOf("--admin");
  const explicitAdmin = adminFlagIndex !== -1;
  if (explicitAdmin) rawArgs.splice(adminFlagIndex, 1);

  const [username, password, ...rest] = rawArgs;
  const displayName = rest.join(" ") || username;

  if (!username || !password) {
    console.error(
      "Usage: npm run create-user --workspace apps/server -- <username> <password> [display name] [--admin]"
    );
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

  const noAdminYet = repos.users.countAdmins() === 0;
  const role = explicitAdmin || noAdminYet ? "admin" : "user";

  const passwordHash = await hashPassword(password);
  const user = repos.users.create({ username, passwordHash, displayName, role });

  const note = !explicitAdmin && noAdminYet ? " (first account -- granted admin automatically)" : "";
  console.log(`Created user "${user.username}" (${user.displayName}) as ${role}${note}`);
}

main();
