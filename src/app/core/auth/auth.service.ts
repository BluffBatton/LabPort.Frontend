import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';

import { BackendEndpointUnavailableError, LabportApiService } from '../api/labport-api.service';
import { RegisterDto } from '../api/api.models';
import { AuthSession, AuthTokenResponse, LoginRequest } from './auth.models';
import { SKIP_AUTH } from './auth-http-context';
import { JwtService } from './jwt.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(LabportApiService);
  private readonly http = inject(HttpClient);
  private readonly jwt = inject(JwtService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly sessionState = signal<AuthSession | null>(this.restoreSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.ensureActiveSession() !== null);
  readonly accessToken = computed(() => this.ensureActiveSession()?.accessToken ?? null);

  login(request: LoginRequest): Observable<AuthSession> {
    const endpoint = this.api.endpoint('auth', 'login');

    if (!endpoint?.path) {
      return throwError(
        () =>
          new BackendEndpointUnavailableError(
            'auth',
            'login',
            endpoint?.todo ?? this.api.unavailableMessage('auth', 'login')
          )
      );
    }

    return this.http
      .post<AuthTokenResponse>(this.api.endpointUrl('auth', 'login'), request, {
        context: new HttpContext().set(SKIP_AUTH, true)
      })
      .pipe(map((response) => this.completeLogin(response)));
  }

  refresh(): Observable<AuthSession> {
    const storedTokens = this.tokenStorage.readTokens();
    const endpoint = this.api.endpoint('auth', 'refresh');

    if (!endpoint?.path) {
      return throwError(
        () =>
          new BackendEndpointUnavailableError(
            'auth',
            'refresh',
            endpoint?.todo ?? this.api.unavailableMessage('auth', 'refresh')
          )
      );
    }

    if (!storedTokens?.accessToken || !storedTokens.refreshToken) {
      return throwError(() => new Error('No refresh token is available for this session.'));
    }

    return this.http
      .post<AuthTokenResponse>(
        this.api.endpointUrl('auth', 'refresh'),
        {
          accessToken: storedTokens.accessToken,
          refreshToken: storedTokens.refreshToken
        },
        {
          context: new HttpContext().set(SKIP_AUTH, true)
        }
      )
      .pipe(map((response) => this.completeLogin(response)));
  }

  register(request: RegisterDto): Observable<string> {
    const endpoint = this.api.endpoint('auth', 'register');

    if (!endpoint?.path) {
      return throwError(
        () =>
          new BackendEndpointUnavailableError(
            'auth',
            'register',
            endpoint?.todo ?? this.api.unavailableMessage('auth', 'register')
          )
      );
    }

    return this.http.post<string>(this.api.endpointUrl('auth', 'register'), request, {
      context: new HttpContext().set(SKIP_AUTH, true)
    });
  }

  useToken(accessToken: string, refreshToken?: string, response?: AuthTokenResponse): AuthSession | null {
    const session = this.jwt.createSession(accessToken, refreshToken, {
      expiresAt: response?.expiresAt,
      user: response?.user
    });

    if (!session || this.jwt.isExpired(session)) {
      this.logout();
      return null;
    }

    this.tokenStorage.writeTokens({
      accessToken,
      refreshToken,
      expiresAt: response?.expiresAt,
      user: response?.user
    });
    this.sessionState.set(session);
    return session;
  }

  ensureActiveSession(): AuthSession | null {
    const session = this.sessionState();

    if (!session) {
      return null;
    }

    if (this.jwt.isExpired(session)) {
      this.logout();
      return null;
    }

    return session;
  }

  hasAnyRole(roles: readonly string[]): boolean {
    const session = this.ensureActiveSession();

    if (!session) {
      return false;
    }

    const sessionRoles = session.roles.map((role) => role.toLowerCase());
    return roles.some((role) => sessionRoles.includes(role.toLowerCase()));
  }

  logout(): void {
    this.tokenStorage.clear();
    this.sessionState.set(null);
  }

  private restoreSession(): AuthSession | null {
    const storedTokens = this.tokenStorage.readTokens();

    if (!storedTokens) {
      return null;
    }

    const session = this.jwt.createSession(storedTokens.accessToken, storedTokens.refreshToken, {
      expiresAt: storedTokens.expiresAt,
      user: storedTokens.user
    });

    if (!session || this.jwt.isExpired(session)) {
      this.tokenStorage.clear();
      return null;
    }

    return session;
  }

  private completeLogin(response: AuthTokenResponse): AuthSession {
    const accessToken = response.accessToken ?? response.token;

    if (!accessToken) {
      throw new Error('Login response did not include a JWT access token.');
    }

    const refreshToken = response.refreshToken ?? undefined;
    const session = this.useToken(accessToken, refreshToken, response);

    if (!session) {
      throw new Error('Login response included an invalid or expired JWT access token.');
    }

    return session;
  }
}
