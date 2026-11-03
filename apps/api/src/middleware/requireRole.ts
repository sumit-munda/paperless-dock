import { Response, NextFunction, Request } from "express";
import { UserRole } from "../generated/prisma/index.js";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
}
