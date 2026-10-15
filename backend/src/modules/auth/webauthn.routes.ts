import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";
import { prisma } from "../../lib/prisma";
import { validateBody } from "../../utils/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { badRequest, notFound, unauthorized } from "../../utils/httpError";

const router = Router();

const RP_NAME = process.env.WEBAUTHN_RP_NAME ?? "FleetNova";
const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:5174";

// Challenges son de un solo uso y de corta duracion: viven en memoria del
// proceso (no en la BD) porque este backend corre en una sola instancia y
// no necesitan sobrevivir un restart.
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
type ChallengeEntry = { challenge: string; expiresAt: number };
const registrationChallenges = new Map<number, ChallengeEntry>();
const loginChallenges = new Map<string, ChallengeEntry>();

function putChallenge<K>(store: Map<K, ChallengeEntry>, key: K, challenge: string) {
  store.set(key, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS });
}

function takeChallenge<K>(store: Map<K, ChallengeEntry>, key: K): string | null {
  const entry = store.get(key);
  store.delete(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.challenge;
}

// GET /api/auth/webauthn/credentials - credenciales biometricas del usuario actual
router.get(
  "/credentials",
  requireAuth,
  asyncHandler(async (req, res) => {
    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, deviceLabel: true, transports: true, createdAt: true, lastUsedAt: true },
    });
    res.json(credentials);
  })
);

// POST /api/auth/webauthn/register-options
router.post(
  "/register-options",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw notFound("Usuario no encontrado");

    const existing = await prisma.webAuthnCredential.findMany({ where: { userId: user.id } });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email,
      userDisplayName: user.name,
      userID: isoUint8Array.fromUTF8String(String(user.id)),
      attestationType: "none",
      excludeCredentials: existing.map((c) => ({ id: c.credentialId, transports: c.transports })),
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
    });

    putChallenge(registrationChallenges, user.id, options.challenge);
    res.json(options);
  })
);

const registerVerifySchema = z.object({
  response: z.record(z.string(), z.any()),
  deviceLabel: z.string().max(60).optional(),
});

// POST /api/auth/webauthn/register-verify
router.post(
  "/register-verify",
  requireAuth,
  validateBody(registerVerifySchema),
  asyncHandler(async (req, res) => {
    const { response, deviceLabel } = req.body as z.infer<typeof registerVerifySchema>;

    const expectedChallenge = takeChallenge(registrationChallenges, req.user!.id);
    if (!expectedChallenge) {
      throw badRequest("La solicitud de registro expiro, intenta de nuevo");
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: response as any,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });
    } catch (err) {
      throw badRequest(err instanceof Error ? err.message : "No se pudo verificar el registro biometrico");
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw badRequest("No se pudo verificar el registro biometrico");
    }

    const { credential } = verification.registrationInfo;

    const saved = await prisma.webAuthnCredential.create({
      data: {
        userId: req.user!.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports ?? [],
        deviceLabel: deviceLabel ?? null,
      },
      select: { id: true, deviceLabel: true, transports: true, createdAt: true },
    });

    res.status(201).json(saved);
  })
);

// DELETE /api/auth/webauthn/credentials/:id
router.delete(
  "/credentials/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw badRequest("Identificador de credencial invalido");

    const existing = await prisma.webAuthnCredential.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user!.id) {
      throw notFound("Credencial no encontrada");
    }

    await prisma.webAuthnCredential.delete({ where: { id } });
    res.status(204).send();
  })
);

const loginOptionsSchema = z.object({ email: z.string().email("Correo invalido") });

// POST /api/auth/webauthn/login-options (publico: aun no hay sesion)
router.post(
  "/login-options",
  validateBody(loginOptionsSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof loginOptionsSchema>;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { webauthnCredentials: true },
    });

    if (!user || user.webauthnCredentials.length === 0) {
      throw badRequest("Esta cuenta no tiene Face ID / Touch ID configurado");
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "required",
      allowCredentials: user.webauthnCredentials.map((c) => ({
        id: c.credentialId,
        transports: c.transports,
      })),
    });

    putChallenge(loginChallenges, email, options.challenge);
    res.json(options);
  })
);

const loginVerifySchema = z.object({
  email: z.string().email("Correo invalido"),
  response: z.record(z.string(), z.any()),
});

// POST /api/auth/webauthn/login-verify (publico: esto ES el login)
router.post(
  "/login-verify",
  validateBody(loginVerifySchema),
  asyncHandler(async (req, res) => {
    const { email, response } = req.body as z.infer<typeof loginVerifySchema>;

    const expectedChallenge = takeChallenge(loginChallenges, email);
    if (!expectedChallenge) {
      throw badRequest("La solicitud de inicio de sesion expiro, intenta de nuevo");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw unauthorized("Credenciales invalidas");

    const credentialId = typeof response.id === "string" ? response.id : undefined;
    const stored = credentialId
      ? await prisma.webAuthnCredential.findUnique({ where: { credentialId } })
      : null;
    if (!stored || stored.userId !== user.id) throw unauthorized("Credenciales invalidas");

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: response as any,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: stored.credentialId,
          publicKey: new Uint8Array(stored.publicKey),
          counter: Number(stored.counter),
          transports: stored.transports,
        },
      });
    } catch (err) {
      throw badRequest(
        err instanceof Error ? err.message : "No se pudo verificar el inicio de sesion biometrico"
      );
    }

    if (!verification.verified) {
      throw unauthorized("No se pudo verificar el inicio de sesion biometrico");
    }

    await prisma.webAuthnCredential.update({
      where: { id: stored.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() },
    });

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  })
);

export default router;
