import { Router } from "express";
import { repos } from "../repositories";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { hashPassword, toPublicUser } from "../services/auth";
import { UserRole } from "../domain/types";

// Mounted at /api/admin -- a distinct prefix (not bare /api) so this router's blanket
// requireAdmin can never intercept unrelated non-admin endpoints registered elsewhere.
export const adminUsersRouter = Router();
adminUsersRouter.use(requireAuth, requireAdmin);

const VALID_ROLES: UserRole[] = ["user", "admin"];

adminUsersRouter.get("/users", (req, res) => {
  res.json(repos.users.listAll().map(toPublicUser));
});

adminUsersRouter.post("/users", async (req, res) => {
  const { username, password, displayName, role } = req.body ?? {};
  if (!username || typeof username !== "string" || !password || typeof password !== "string") {
    res.status(400).json({ error: "username and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "password must be at least 6 characters" });
    return;
  }
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: "invalid role" });
    return;
  }
  if (repos.users.findByUsername(username)) {
    res.status(409).json({ error: "username already taken" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = repos.users.create({ username, passwordHash, displayName: displayName || username, role });
  res.status(201).json(toPublicUser(user));
});

adminUsersRouter.patch("/users/:id", async (req, res) => {
  const target = repos.users.findById(req.params.id);
  if (!target) {
    res.status(404).json({ error: "user not found" });
    return;
  }

  const { role, password } = req.body ?? {};

  if (role !== undefined) {
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: "invalid role" });
      return;
    }
    if (target.role === "admin" && role !== "admin" && repos.users.countAdmins() <= 1) {
      res.status(400).json({ error: "cannot remove the last admin" });
      return;
    }
    repos.users.updateRole(target.id, role);
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "password must be at least 6 characters" });
      return;
    }
    const passwordHash = await hashPassword(password);
    repos.users.updatePassword(target.id, passwordHash);
  }

  res.json(toPublicUser(repos.users.findById(target.id)!));
});

adminUsersRouter.delete("/users/:id", (req, res) => {
  const target = repos.users.findById(req.params.id);
  if (!target) {
    res.status(404).json({ error: "user not found" });
    return;
  }
  if (target.id === req.user!.id) {
    res.status(400).json({ error: "cannot delete your own account" });
    return;
  }
  if (target.role === "admin" && repos.users.countAdmins() <= 1) {
    res.status(400).json({ error: "cannot delete the last admin" });
    return;
  }
  repos.users.delete(target.id);
  res.status(204).send();
});
