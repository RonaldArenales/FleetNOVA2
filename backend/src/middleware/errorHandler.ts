import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/httpError";

// 404 handler for unmatched routes.
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

// Global error handler: converts any thrown/forwarded error into a
// consistent { error: string } JSON response with the right status code.
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Ya existe un registro con ese valor unico" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Recurso no encontrado" });
    }
    return res.status(400).json({ error: "Error en la solicitud a la base de datos" });
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  res.status(500).json({ error: message || "Error interno del servidor" });
};
