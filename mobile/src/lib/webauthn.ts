import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
  WebAuthnError,
} from '@simplewebauthn/browser';
import { api } from './api';
import type { LoginResponse, WebAuthnCredentialSummary } from '../types';

const REMEMBERED_EMAIL_KEY = 'fleetnova.conductor.passkeyEmail';

export function getRememberedPasskeyEmail(): string | null {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function rememberPasskeyEmail(email: string) {
  try {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  } catch {
    // localStorage puede no estar disponible (ej. modo privado); no es critico.
  }
}

// true solo si este navegador/dispositivo puede hablar con un autenticador
// de plataforma (Face ID, Touch ID, huella de Android, Windows Hello...).
export async function isBiometricLoginAvailable(): Promise<boolean> {
  if (!browserSupportsWebAuthn()) return false;
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

export function isPasskeyCeremonyCancelled(error: unknown): boolean {
  return error instanceof WebAuthnError && error.code === 'ERROR_CEREMONY_ABORTED';
}

export async function fetchPasskeys(): Promise<WebAuthnCredentialSummary[]> {
  const { data } = await api.get<WebAuthnCredentialSummary[]>('/auth/webauthn/credentials');
  return data;
}

// Registra este dispositivo: requiere que el usuario ya tenga una sesion
// valida (el token va en el header via el interceptor de axios en api.ts).
export async function registerPasskey(deviceLabel?: string): Promise<WebAuthnCredentialSummary> {
  const { data: optionsJSON } = await api.post('/auth/webauthn/register-options');
  const response = await startRegistration({ optionsJSON });
  const { data } = await api.post<WebAuthnCredentialSummary>('/auth/webauthn/register-verify', {
    response,
    deviceLabel,
  });
  return data;
}

export async function removePasskey(id: number): Promise<void> {
  await api.delete(`/auth/webauthn/credentials/${id}`);
}

// Inicio de sesion sin contrasena: el servidor emite el mismo token/usuario
// que /auth/login una vez verificada la firma biometrica.
export async function loginWithPasskey(email: string): Promise<LoginResponse> {
  const { data: optionsJSON } = await api.post('/auth/webauthn/login-options', { email });
  const response = await startAuthentication({ optionsJSON });
  const { data } = await api.post<LoginResponse>('/auth/webauthn/login-verify', { email, response });
  return data;
}
