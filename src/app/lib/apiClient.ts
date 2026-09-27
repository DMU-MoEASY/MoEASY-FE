import { runtimeConfig } from '../config/runtime';

export type ApiMeta = {
  requestId?: string;
  timestamp?: string;
};

export type ApiEnvelope<T> = {
  data?: T;
  result?: T;
  isSuccess?: boolean;
  code?: string;
  message?: string;
  meta?: ApiMeta;
};

export type ApiErrorBody = {
  code?: string;
  message?: string;
  result?: Record<string, string[] | string> | null;
  error?: {
    code?: string;
    message?: string;
    fieldErrors?: FieldError[];
  };
  meta?: ApiMeta;
};

export type FieldError = { field: string; reason?: string; message: string };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fieldErrors?: FieldError[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

type RetryOptions = {
  auth: boolean;
  csrf: boolean;
};

type CsrfResult = {
  token: string;
  headerName?: string;
};

let csrfToken: string | null = null;
let csrfHeaderName = 'X-XSRF-TOKEN';
let csrfRequest: Promise<string> | null = null;

async function parseBody(response: Response) {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

function toFieldErrors(result: ApiErrorBody['result']): FieldError[] | undefined {
  if (!result) return undefined;
  return Object.entries(result).flatMap(([field, value]) => {
    const messages = Array.isArray(value) ? value : [value];
    return messages.map(message => ({ field, message }));
  });
}

function toApiError(response: Response, body: unknown) {
  const apiError = typeof body === 'object' && body !== null ? body as ApiErrorBody : undefined;
  return new ApiError(
    response.status,
    apiError?.code ?? apiError?.error?.code ?? 'HTTP_ERROR',
    apiError?.message ?? apiError?.error?.message ?? `요청을 처리하지 못했습니다. (${response.status})`,
    apiError?.error?.fieldErrors ?? toFieldErrors(apiError?.result),
  );
}

function unwrapBody<T>(body: unknown): T {
  if (body && typeof body === 'object') {
    if ('result' in body) return (body as ApiEnvelope<T>).result as T;
    if ('data' in body) return (body as ApiEnvelope<T>).data as T;
  }
  return body as T;
}

function isStateChanging(method?: string) {
  const normalizedMethod = (method ?? 'GET').toUpperCase();
  return !['GET', 'HEAD', 'OPTIONS'].includes(normalizedMethod);
}

async function fetchCsrfToken() {
  const response = await fetch(`${runtimeConfig.apiBaseUrl}/auth/csrf`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const body = await parseBody(response);
  if (!response.ok) throw toApiError(response, body);

  const result = unwrapBody<CsrfResult>(body);
  if (!result?.token) {
    throw new ApiError(500, 'INVALID_CSRF_RESPONSE', 'CSRF 토큰 응답을 확인할 수 없습니다.');
  }

  csrfToken = result.token;
  csrfHeaderName = result.headerName || 'X-XSRF-TOKEN';
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
  csrfHeaderName = 'X-XSRF-TOKEN';
  csrfRequest = null;
}

export async function ensureCsrfToken(forceRefresh = false) {
  if (forceRefresh) clearCsrfToken();
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = fetchCsrfToken().finally(() => {
      csrfRequest = null;
    });
  }
  return csrfRequest;
}

async function requestInternal<T>(
  path: string,
  options: RequestOptions,
  retry: RetryOptions,
): Promise<T> {
  const { body: requestBody, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set('Accept', 'application/json');

  const hasBody = requestBody !== undefined;
  if (hasBody && !(requestBody instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (isStateChanging(requestOptions.method) && path !== '/auth/csrf') {
    const token = await ensureCsrfToken();
    headers.set(csrfHeaderName, token);
  }

  const requestInit: RequestInit = {
    ...requestOptions,
    credentials: 'include',
    headers,
  };
  if (hasBody) {
    requestInit.body = requestBody instanceof FormData ? requestBody : JSON.stringify(requestBody);
  }

  const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, requestInit);
  const body = await parseBody(response);

  if (!response.ok) {
    const error = toApiError(response, body);

    if (retry.csrf && error.status === 403 && error.code === 'AUTH403_1' && isStateChanging(requestOptions.method)) {
      await ensureCsrfToken(true);
      return requestInternal<T>(path, options, { ...retry, csrf: false });
    }

    if (retry.auth && error.status === 401 && error.code === 'AUTH401_1' && path !== '/auth/reissue') {
      await requestInternal<void>('/auth/reissue', { method: 'POST' }, { auth: false, csrf: true });
      return requestInternal<T>(path, options, { ...retry, auth: false });
    }

    throw error;
  }

  return unwrapBody<T>(body);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return requestInternal<T>(path, options, { auth: true, csrf: true });
}
