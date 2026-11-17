import type {
  ChatResponse,
  DocumentsResponse,
  StudyDocument,
  UploadUrlResponse,
} from './types';

/**
 * Accepts the bare API host. Also tolerates the endpoint line printed by `sls info`
 * (".../api/{proxy+}") or a trailing "/api", since every route below already starts with "/api".
 */
function normalizeBase(raw: string): string {
  return raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/(\{proxy\+\}|%7Bproxy\+%7D)$/i, '')
    .replace(/\/api$/i, '')
    .replace(/\/+$/, '');
}

const BASE = normalizeBase(process.env.NEXT_PUBLIC_API_URL ?? '');

export const isApiConfigured = BASE.length > 0;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError('NEXT_PUBLIC_API_URL is not set. Add it to .env.local and restart `npm run dev`.', 0);
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and the API CORS settings.', 0);
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

/** POST /api/upload-url -> presigned S3 PUT URL */
export function getUploadUrl(userId: string, fileName: string, fileType: string) {
  return request<UploadUrlResponse>('/api/upload-url', {
    method: 'POST',
    body: JSON.stringify({ userId, fileName, fileType }),
  });
}

/**
 * PUT the file straight to S3. XMLHttpRequest is used because fetch() cannot report upload progress.
 * `headers` MUST be the `requiredHeaders` from /api/upload-url, otherwise S3 rejects the signature.
 */
export function uploadToS3(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else if (xhr.status === 403) {
        reject(new ApiError('Upload was rejected by storage (the link may have expired). Please retry.', 403));
      } else {
        reject(new ApiError(`Upload failed (${xhr.status}).`, xhr.status));
      }
    };
    xhr.onerror = () =>
      reject(new ApiError('Upload failed. Check your connection and the S3 bucket CORS origin.', 0));
    xhr.onabort = () => reject(new ApiError('Upload cancelled.', 0));
    xhr.send(file);
  });
}

/** GET /api/documents/:userId (follows pagination cursors, capped for safety) */
export async function listDocuments(userId: string): Promise<StudyDocument[]> {
  const all: StudyDocument[] = [];
  let cursor: string | null = null;
  for (let i = 0; i < 20; i++) {
    const qs: string = new URLSearchParams({ limit: '100', ...(cursor ? { cursor } : {}) }).toString();
    const page: DocumentsResponse = await request<DocumentsResponse>(
      `/api/documents/${encodeURIComponent(userId)}?${qs}`,
    );
    all.push(...page.documents);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

/** POST /api/chat */
/** `documents` = file names to search in; empty/omitted = all documents. */
export function sendChat(params: { userId: string; question: string; sessionId?: string; documents?: string[] }) {
  return request<ChatResponse>('/api/chat', { method: 'POST', body: JSON.stringify(params) });
}

/** DELETE /api/documents/:userId/:fileName (added to the backend in this delivery) */
export function deleteDocument(userId: string, fileName: string) {
  return request<{ deleted: boolean }>(
    `/api/documents/${encodeURIComponent(userId)}/${encodeURIComponent(fileName)}`,
    { method: 'DELETE' },
  );
}
