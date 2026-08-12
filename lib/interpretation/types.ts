export type SessionStatus = "waiting" | "live" | "closed";
export type SessionVisibility = "public" | "private";

export interface InterpretationSession {
  id: string;
  roomId?: string;
  title: string;
  speaker?: string;
  description?: string;
  /** Deepgram keyterm prompting — STT 인식 부스트용 (최대 100개) */
  keyterms?: string[];
  visibility: SessionVisibility;
  status: SessionStatus;
  sourceLanguage?: string;
  targetLanguages: string[];
  streamUrl?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string;
  participantCount?: number;
}

export interface CreateSessionInput {
  title: string;
  speaker?: string;
  description?: string;
  keyterms?: string[];
  visibility: SessionVisibility;
  sourceLanguage: string;
  targetLanguages: string[];
  password?: string;
  scheduledAt?: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface StreamTranscriptEvent {
  type: "transcript";
  id: string;
  seq: number;
  text: string;
  isFinal: boolean;
  at: string;
}

export interface StreamTranslationEvent {
  type: "translation";
  id: string;
  seq: number;
  lang: string;
  text: string;
  isFinal: boolean;
  at: string;
}

export interface StreamPresenceEvent {
  type: "presence" | "stats" | "room_stats" | "participants";
  total?: number;
  byLang?: Record<string, number>;
  counts?: Record<string, number>;
  participantsByLang?: Record<string, number>;
}
