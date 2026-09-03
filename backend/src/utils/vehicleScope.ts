import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";

// null = sin filtro (ve toda la flota). { ownerId } = solo vehiculos de ese dueno.
export type VehicleScope = { ownerId: number } | null;

/**
 * Determina que vehiculos puede ver/operar un usuario del panel admin:
 * - ADMIN: sin filtro, ve todo.
 * - OPERATOR: solo los vehiculos que el mismo registro (ownerId = su id).
 * - VIEWER: solo los vehiculos del operador al que fue asociado
 *   (viewScopeOwnerId); sin asociacion, no ve ningun vehiculo (-1 no matchea).
 */
export async function getVehicleScope(user: { id: number; role: Role }): Promise<VehicleScope> {
  if (user.role === Role.ADMIN) return null;
  if (user.role === Role.OPERATOR) return { ownerId: user.id };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { viewScopeOwnerId: true },
  });
  return { ownerId: dbUser?.viewScopeOwnerId ?? -1 };
}

export function inScope(ownerId: number, scope: VehicleScope): boolean {
  return scope === null || ownerId === scope.ownerId;
}
