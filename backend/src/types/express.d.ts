import { Role } from "@prisma/client";

// Augments Express's Request type so req.user is known everywhere
// after requireAuth has run.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

export {};
