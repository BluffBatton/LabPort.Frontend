import { HttpErrorResponse } from '@angular/common/http';

export function readableApiError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const backendMessage = backendErrorMessage(error.error);
    return `${error.status} ${backendMessage}`.trim();
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
}

function backendErrorMessage(errorBody: unknown): string {
  if (!errorBody) {
    return 'Request failed';
  }

  if (typeof errorBody === 'string') {
    return cleanMessage(errorBody);
  }

  if (typeof errorBody === 'object') {
    const body = errorBody as Record<string, unknown>;
    const message = body['detail'] ?? body['message'] ?? body['title'] ?? body['error'];

    if (typeof message === 'string') {
      return cleanMessage(message);
    }

    if (body['errors']) {
      return summarizeErrors(body['errors']);
    }
  }

  return 'Request failed';
}

function cleanMessage(message: string): string {
  const firstLine = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith('at '));

  if (!firstLine) {
    return 'Request failed';
  }

  return firstLine.length > 500 ? `${firstLine.slice(0, 500)}...` : firstLine;
}

function summarizeErrors(errors: unknown): string {
  if (!errors || typeof errors !== 'object') {
    return 'Validation failed';
  }

  return Object.entries(errors as Record<string, unknown>)
    .flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map((message) => `${field}: ${String(message)}`);
      }

      return [`${field}: ${String(value)}`];
    })
    .join('; ');
}
