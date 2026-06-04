import { Injectable } from '@angular/core';

import { UserInfoDto } from '../api/api.models';
import { AuthSession, JwtClaims } from './auth.models';

const roleClaimNames = [
  'role',
  'roles',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
] as const;

interface SessionSeed {
  readonly expiresAt?: string;
  readonly user?: UserInfoDto;
}

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  createSession(accessToken: string, refreshToken?: string, seed?: SessionSeed): AuthSession | null {
    const claims = this.decode(accessToken);

    if (!claims) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      userId: seed?.user?.id ?? null,
      subject: seed?.user?.id ?? this.stringClaim(claims, 'sub') ?? this.stringClaim(claims, 'nameid'),
      displayName: this.stringClaim(claims, 'name') ?? this.stringClaim(claims, 'email'),
      roles: this.collectRoles(claims, seed?.user),
      expiresAt: this.responseExpirationTime(seed?.expiresAt) ?? this.expirationTime(claims),
      claims
    };
  }

  isExpired(session: AuthSession): boolean {
    return typeof session.expiresAt === 'number' && session.expiresAt <= Date.now();
  }

  private decode(token: string): JwtClaims | null {
    const payload = token.split('.')[1];

    if (!payload) {
      return null;
    }

    try {
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
      return JSON.parse(atob(paddedPayload)) as JwtClaims;
    } catch {
      return null;
    }
  }

  private expirationTime(claims: JwtClaims): number | null {
    const expiresAt = claims['exp'];

    if (typeof expiresAt === 'number') {
      return expiresAt * 1000;
    }

    if (typeof expiresAt === 'string') {
      const parsed = Number(expiresAt);
      return Number.isFinite(parsed) ? parsed * 1000 : null;
    }

    return null;
  }

  private collectRoles(claims: JwtClaims, user?: UserInfoDto): string[] {
    const roles = roleClaimNames.flatMap((claimName) => this.stringArrayClaim(claims[claimName]));

    if (user?.role) {
      roles.push(user.role);
    }

    return Array.from(new Set(roles));
  }

  private responseExpirationTime(expiresAt: string | undefined): number | null {
    if (!expiresAt) {
      return null;
    }

    const parsed = Date.parse(expiresAt);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private stringArrayClaim(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return [];
  }

  private stringClaim(claims: JwtClaims, claimName: string): string | null {
    const value = claims[claimName];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }
}
