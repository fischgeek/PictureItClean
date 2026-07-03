import { NextFunction, Request, Response } from "express";
import { ResourceType, Role } from "../domain/types";
import { hasRole, NotFoundError } from "../services/accessControl";

/**
 * Requires req.user to hold at least `min` role on the resource identified by
 * req.params[paramName], considering the building/area/space ancestor chain.
 */
export function requireRole(resourceType: ResourceType, paramName: string, min: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[paramName];
    try {
      if (!hasRole(req.user!.id, resourceType, resourceId, min)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  };
}
