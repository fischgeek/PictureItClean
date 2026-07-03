import { Router } from "express";
import { repos } from "../repositories";
import { AUTH_COOKIE, signToken, toPublicUser, verifyPassword } from "../services/auth";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

// There is no self-registration route. Accounts are created by the server admin
// via the CLI script in src/cli/createUser.ts (see README).

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  const user = username ? repos.users.findByUsername(username) : null;
  if (!user || !(await verifyPassword(password ?? "", user.passwordHash))) {
    res.status(401).json({ error: "invalid username or password" });
    return;
  }
  const token = signToken(user.id);
  res.cookie(AUTH_COOKIE, token, COOKIE_OPTS);
  res.json(toPublicUser(user));
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(toPublicUser(req.user!));
});
