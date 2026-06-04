import { Injectable } from '@angular/core';

import { UserInfoDto } from '../api/api.models';

export interface StoredAuthTokens {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresAt?: string;
  readonly user?: UserInfoDto;
}

const accessTokenKey = 'labport.accessToken';
const refreshTokenKey = 'labport.refreshToken';
const expiresAtKey = 'labport.expiresAt';
const userKey = 'labport.user';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  readTokens(): StoredAuthTokens | null {
    try {
      const accessToken = localStorage.getItem(accessTokenKey);

      if (!accessToken) {
        return null;
      }

      const refreshToken = localStorage.getItem(refreshTokenKey) ?? undefined;
      const expiresAt = localStorage.getItem(expiresAtKey) ?? undefined;
      const user = this.readUser();
      return { accessToken, refreshToken, expiresAt, user };
    } catch {
      return null;
    }
  }

  writeTokens(tokens: StoredAuthTokens): void {
    localStorage.setItem(accessTokenKey, tokens.accessToken);

    if (tokens.refreshToken) {
      localStorage.setItem(refreshTokenKey, tokens.refreshToken);
    } else {
      localStorage.removeItem(refreshTokenKey);
    }

    if (tokens.expiresAt) {
      localStorage.setItem(expiresAtKey, tokens.expiresAt);
    } else {
      localStorage.removeItem(expiresAtKey);
    }

    if (tokens.user) {
      localStorage.setItem(userKey, JSON.stringify(tokens.user));
    } else {
      localStorage.removeItem(userKey);
    }
  }

  clear(): void {
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(expiresAtKey);
    localStorage.removeItem(userKey);
  }

  private readUser(): UserInfoDto | undefined {
    const rawUser = localStorage.getItem(userKey);

    if (!rawUser) {
      return undefined;
    }

    try {
      return JSON.parse(rawUser) as UserInfoDto;
    } catch {
      localStorage.removeItem(userKey);
      return undefined;
    }
  }
}
