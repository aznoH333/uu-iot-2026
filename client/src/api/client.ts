import type { ApiErrorResponse } from '../types/api';
import {VITE_API_BASE_URL} from '../../setting.js';

export const API_BASE_URL = VITE_API_BASE_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    body,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  const data = contentType?.includes('application/json')
    ? await response.json()
    : undefined;

  if (!response.ok) {
    const error = data as ApiErrorResponse | undefined;
    throw new ApiError(error?.message ?? 'Request failed', response.status);
  }

  return data as T;
}
