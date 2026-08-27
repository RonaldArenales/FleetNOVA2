import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { unauthorized, forbidden } from "../utils/httpError";

interface JwtPayload {
  userId: string;
  role: Role;
}

/**
 * Verifies the "Authorization: Bearer <token>" header and attaches
 * req.user = { id, role }. Responds 401 when missing/invalid.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(unauthorized("Token de autenticacion requerido"));
  }

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new Error("JWT_SECRET no configurado en el servidor"));
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    next(unauthorized("Token invalido o expirado"));
  }
};

/**
 * Middleware factory: only allows through users whose role is in
 * `roles`. Must run after requireAuth.
 */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(forbidden("No tiene permisos para realizar esta accion"));
    }
    next();
  };
