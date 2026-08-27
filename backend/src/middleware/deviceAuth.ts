import { Request, Response, NextFunction } from "express";
import { unauthorized } from "../utils/httpError";

/**
 * Authenticates simulated GPS/OBD-II devices posting telemetry.
 * These are not logged-in users, so they don't send a JWT — instead
 * they send a shared secret in the "x-device-key" header.
 */
export const requireDeviceKey = (req: Request, _res: Response, next: NextFunction) => {
  const key = req.headers["x-device-key"];
  if (!key || key !== process.env.DEVICE_API_KEY) {
    return next(unauthorized("Clave de dispositivo invalida"));
  }
  next();
};
