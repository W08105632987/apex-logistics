// Thin fetch wrapper for the backend API. Auth is a httpOnly cookie set by the server,
// so no tokens are ever stored in JavaScript-accessible storage.

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function api<T = any>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : method === 'POST' || method === 'PATCH' ? '{}' : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection and try again.');
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || `Request failed (${res.status}).`, data?.code);
  }
  return data as T;
}

export const apiGet = <T = any>(path: string) => api<T>('GET', path);
export const apiPost = <T = any>(path: string, body?: unknown) => api<T>('POST', path, body ?? {});
export const apiPatch = <T = any>(path: string, body?: unknown) => api<T>('PATCH', path, body ?? {});
export const apiDelete = <T = any>(path: string) => api<T>('DELETE', path);

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}
