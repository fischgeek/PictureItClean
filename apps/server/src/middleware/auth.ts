import { NextFunction, Request, Response } from "express";
import { repos } from "../repositories";
import { AUTH_COOKIE, verifyToken } from "../services/auth";
import { User } from "../domain/types";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = repos.users.findById(userId);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.user = user;
  next();
}
