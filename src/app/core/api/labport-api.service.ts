import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BACKEND_ENDPOINTS, BackendEndpointArea, BackendEndpointDefinition } from './backend-endpoints';

type EndpointMap = Record<string, BackendEndpointDefinition>;
type PathParams = Record<string, string | number>;
type QueryParams = Record<string, string | number | boolean | null | undefined>;

export class BackendEndpointUnavailableError extends Error {
  constructor(area: string, name: string, message: string) {
    super(`${area}.${name}: ${message}`);
    this.name = 'BackendEndpointUnavailableError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class LabportApiService {
  readonly endpoints = BACKEND_ENDPOINTS;

  endpoint(area: string, name: string): BackendEndpointDefinition | null {
    const areaEndpoints = this.endpoints[area as BackendEndpointArea] as EndpointMap | undefined;
    return areaEndpoints?.[name] ?? null;
  }

  isAvailable(area: string, name: string): boolean {
    const endpoint = this.endpoint(area, name);
    return typeof endpoint?.path === 'string' && endpoint.path.length > 0;
  }

  unavailableMessage(area: string, name: string): string {
    const endpoint = this.endpoint(area, name);
    return endpoint?.todo ?? 'Server support is not available for this feature yet.';
  }

  endpointLabel(area: string, name: string): string {
    const endpoint = this.endpoint(area, name);

    if (!endpoint?.path) {
      return this.unavailableMessage(area, name);
    }

    return `${endpoint.method} ${endpoint.path}`;
  }

  endpointUrl(area: string, name: string, pathParams: PathParams = {}, queryParams: QueryParams = {}): string {
    const path = this.applyPathParams(this.requirePath(area, name), pathParams);
    const baseUrl = environment.apiBaseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const query = this.serializeQuery(queryParams);

    return `${baseUrl}${normalizedPath}${query}`;
  }

  requirePath(area: string, name: string): string {
    const endpoint = this.endpoint(area, name);

    if (endpoint?.path) {
      return endpoint.path;
    }

    throw new BackendEndpointUnavailableError(area, name, this.unavailableMessage(area, name));
  }

  private applyPathParams(path: string, pathParams: PathParams): string {
    return Object.entries(pathParams).reduce(
      (nextPath, [key, value]) => nextPath.replace(new RegExp(`{${key}}`, 'gi'), encodeURIComponent(String(value))),
      path
    );
  }

  private serializeQuery(queryParams: QueryParams): string {
    const params = new URLSearchParams();

    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });

    const query = params.toString();
    return query ? `?${query}` : '';
  }
}
