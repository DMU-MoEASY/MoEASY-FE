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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body: requestBody, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  headers.set('Accept', 'application/json');

  const hasBody = requestBody !== undefined;
  if (hasBody && !(requestBody instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
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
    const apiError = typeof body === 'object' && body !== null ? body as ApiErrorBody : undefined;
    throw new ApiError(
      response.status,
      apiError?.code ?? apiError?.error?.code ?? 'HTTP_ERROR',
      apiError?.message ?? apiError?.error?.message ?? `요청을 처리하지 못했습니다. (${response.status})`,
      apiError?.error?.fieldErrors ?? toFieldErrors(apiError?.result),
    );
  }

  if (body && typeof body === 'object') {
    if ('result' in body) return (body as ApiEnvelope<T>).result as T;
    if ('data' in body) return (body as ApiEnvelope<T>).data as T;
  }
  return body as T;
}
