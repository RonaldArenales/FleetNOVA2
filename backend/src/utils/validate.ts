import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { badRequest } from "./httpError";

/**
 * Runs a Zod schema against req.body and replaces req.body with the
 * parsed (and coerced/defaulted) value. On failure, forwards a 400
 * HttpError with the Zod issue details to the global error handler.
 */
export const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        badRequest("Datos invalidos en la solicitud", result.error.flatten())
      );
    }
    req.body = result.data;
    next();
  };

/**
 * Runs a Zod schema against req.query and replaces req.query with the
 * parsed value. On failure, forwards a 400 HttpError.
 */
export const validateQuery =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        badRequest("Parametros de consulta invalidos", result.error.flatten())
      );
    }
    (req as any).validatedQuery = result.data;
    next();
  };

/**
 * Parses a positive integer "take" query param (how many of the most
 * recent items a "Ver mas" button should request), clamped to [1, max].
 * Falls back to `def` when missing or invalid.
 */
export function parseTake(raw: unknown, def: number, max: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : def;
}
