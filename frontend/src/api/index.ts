import { ApiError, OpenAPI } from './generated';

OpenAPI.BASE = '';

// true if the backend no longer knows the stored user (e.g. after a semester reset)
export function isUserNotFound(e: unknown): boolean {
  return e instanceof ApiError && e.status === 404 && e.body?.message === 'user not found';
}

export * from './generated';
