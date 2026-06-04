import { AuthResponseDto } from '../api/api.models';

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthTokenResponse extends AuthResponseDto {
  readonly token?: string | null;
}

export interface JwtClaims extends Record<string, unknown> {
  readonly sub?: string;
  readonly exp?: number;
  readonly name?: string;
  readonly email?: string;
}

export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly userId: string | null;
  readonly subject: string | null;
  readonly displayName: string | null;
  readonly roles: readonly string[];
  readonly expiresAt: number | null;
  readonly claims: JwtClaims;
}

export const ADMIN_ROLES = ['admin', 'administrator', 'labport.admin'] as const;
