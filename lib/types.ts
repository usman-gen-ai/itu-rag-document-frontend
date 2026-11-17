export type DocStatus = 'READY' | 'PROCESSING' | 'QUEUED' | 'FAILED' | 'UNKNOWN';

export interface StudyDocument {
  fileName: string;
  key: string;
  s3Uri: string;
  size: number;
  uploadedAt: string;
  status: DocStatus;
  rawStatus?: string;
  statusReason?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  method: 'PUT';
  requiredHeaders: Record<string, string>;
  key: string;
  fileName: string;
  expiresIn: number;
}

export interface DocumentsResponse {
  userId: string;
  count: number;
  documents: StudyDocument[];
  nextCursor: string | null;
}

export interface Source {
  documentName: string;
  /** null for formats without pages (TXT, some DOCX) */
  page: number | null;
  snippet: string;
  s3Uri: string;
}

/** grounded = answer from documents, chat = greeting/small talk, notfound = nothing in the documents */
export type AnswerKind = 'grounded' | 'chat' | 'notfound';

export interface ChatResponse {
  answer: string;
  sources: Source[];
  type?: AnswerKind;
  sessionId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  kind?: AnswerKind;
  isError?: boolean;
  createdAt: number;
}

export interface Student {
  id: string;
  name: string;
}
