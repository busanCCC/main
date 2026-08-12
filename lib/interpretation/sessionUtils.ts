import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeKeyterms } from "./keyterms";
import type { CreateSessionInput, InterpretationSession, SessionStatus } from "./types";

export function dbStatusToApi(status: string): SessionStatus {
  if (status === "scheduled") return "waiting";
  if (status === "ended") return "closed";
  return "live";
}

/**
 * 비밀번호 해시는 DB 에서만 만든다.
 *
 * 앱의 unlock_interpretation_session() 이 pgcrypto crypt() 로 대조하므로,
 * 만드는 쪽도 같은 함수를 써야 한다. 여기서 Node 로 직접 해시하면(예전 scrypt 방식)
 * 형식이 갈라져 관리자가 만든 비공개 세션을 앱에서 영영 열 수 없다.
 */
export async function hashSessionPassword(
  supabase: SupabaseClient,
  password: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("hash_interpretation_password", {
    p_password: password,
  });

  if (error) throw new Error(`비밀번호 해시 생성 실패: ${error.message}`);
  if (typeof data !== "string" || !data.startsWith("$2")) {
    throw new Error("비밀번호 해시 형식이 올바르지 않습니다.");
  }

  return data;
}

export function generateRoomId(): string {
  return `room_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateRoomPassword(): string {
  return randomBytes(4).toString("hex");
}

interface DbSessionRow {
  id: string;
  title: string;
  speaker: string | null;
  description: string | null;
  keyterms: string[] | null;
  source_lang: string;
  target_langs: string[];
  room_id: string;
  stream_url: string | null;
  status: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  visibility: string;
}

export function rowToSession(row: DbSessionRow): InterpretationSession {
  return {
    id: row.id,
    roomId: row.room_id,
    title: row.title,
    speaker: row.speaker ?? undefined,
    description: row.description ?? undefined,
    keyterms: row.keyterms?.length ? row.keyterms : undefined,
    visibility: row.visibility as InterpretationSession["visibility"],
    status: dbStatusToApi(row.status),
    sourceLanguage: row.source_lang,
    targetLanguages: row.target_langs ?? [],
    streamUrl: row.stream_url ?? undefined,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    participantCount: 0,
  };
}

export function getStreamPublicUrl(): string {
  return process.env.NEXT_PUBLIC_CCC_STREAM_URL ?? "ws://localhost:3002";
}

export async function buildCreatePayload(
  supabase: SupabaseClient,
  input: CreateSessionInput,
) {
  const roomId = generateRoomId();
  const streamUrl = `${getStreamPublicUrl()}/client/ws`;

  let passwordHash: string | null = null;
  let generatedPassword: string | undefined;

  if (input.visibility === "private") {
    const plain = input.password?.trim() || generateRoomPassword();
    if (!input.password?.trim()) generatedPassword = plain;
    passwordHash = await hashSessionPassword(supabase, plain);
  }

  const keyterms = normalizeKeyterms(input.keyterms ?? []);

  return {
    room_id: roomId,
    title: input.title,
    speaker: input.speaker ?? null,
    description: input.description ?? null,
    keyterms: keyterms.length ? keyterms : null,
    visibility: input.visibility,
    source_lang: input.sourceLanguage,
    target_langs: input.targetLanguages,
    status: "scheduled",
    stream_url: streamUrl,
    password_hash: passwordHash,
    scheduled_at: input.scheduledAt ?? null,
    generatedPassword,
  };
}
