import { Router } from "express";
import { repos } from "../repositories";
import { AUTH_COOKIE, signToken, toPublicUser, verifyPassword } from "../services/auth";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

// Secure cookies are only stored by browsers over HTTPS. Self-hosted deployments are commonly
// accessed over plain HTTP on a LAN, so this must NOT be tied to NODE_ENV=="production" (a
// production build isn't the same thing as an HTTPS deployment). Set COOKIE_SECURE=true only
// once this app is actually served over HTTPS (e.g. behind a TLS-terminating reverse proxy).
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.COOKIE_SECURE === "true",
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
