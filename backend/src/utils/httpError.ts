// Simple typed error used across the app so the global error handler
// can respond with the right HTTP status code and a Spanish message.
export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, message, details);
export const unauthorized = (message = "No autorizado") =>
  new HttpError(401, message);
export const forbidden = (message = "Acceso denegado") =>
  new HttpError(403, message);
export const notFound = (message = "Recurso no encontrado") =>
  new HttpError(404, message);
