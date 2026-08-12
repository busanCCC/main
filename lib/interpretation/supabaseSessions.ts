import { createClient } from "@supabase/supabase-js";
import type { CreateSessionInput, InterpretationSession } from "./types";
import { normalizeKeyterms } from "./keyterms";
import { buildCreatePayload, rowToSession } from "./sessionUtils";
import { notifyStreamServer } from "./streamNotify";

function streamSessionPayload(session: InterpretationSession) {
  return {
    sessionId: session.id,
    roomId: session.roomId,
    sourceLang: session.sourceLanguage,
    targetLangs: session.targetLanguages,
    title: session.title,
    speaker: session.speaker,
    description: session.description,
    keyterms: session.keyterms,
  };
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function listSessions(): Promise<InterpretationSession[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("interpretation_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToSession);
}

export async function getSession(id: string): Promise<InterpretationSession | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("interpretation_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToSession(data) : null;
}

export async function createSession(input: CreateSessionInput) {
  const supabase = getServiceClient();
  const payload = await buildCreatePayload(supabase, input);
  const { generatedPassword, ...insertRow } = payload;

  const { data, error } = await supabase
    .from("interpretation_sessions")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const session = rowToSession(data);
  await notifyStreamServer("/internal/sessions/register", streamSessionPayload(session));

  return { session, generatedPassword };
}

export async function deleteSession(id: string): Promise<void> {
  const existing = await getSession(id);
  if (!existing) throw new Error("세션이 존재하지 않습니다.");

  if (existing.roomId) {
    await notifyStreamServer("/internal/sessions/stop", {
      roomId: existing.roomId,
      reason: "admin_stop",
    });
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from("interpretation_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function startSession(id: string): Promise<InterpretationSession> {
  const current = await getSession(id);
  if (!current) throw new Error("세션이 존재하지 않습니다.");
  if (current.status === "closed") throw new Error("종료된 세션입니다.");

  let session = current;

  if (current.status !== "live") {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("interpretation_sessions")
      .update({ status: "live" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    session = rowToSession(data);
  }

  // 이미 live 여도 반드시 다시 알린다.
  //
  // 스트림 서버는 방을 메모리에만 들고 있어서(docs/01 §5) 재시작하면 전부 잃는다.
  // 그런데 DB 는 여전히 live 라, 여기서 건너뛰면 다시 시작을 눌러도 통보가 나가지
  // 않아 방이 영영 복구되지 않는다 — 관리자 음성이 조용히 버려진다.
  // 스트림 쪽 /internal/sessions/start 는 없으면 등록하고 있으면 그대로 두므로
  // 여러 번 불러도 안전하다.
  await notifyStreamServer("/internal/sessions/start", streamSessionPayload(session));

  return session;
}

export async function updateSessionKeyterms(
  id: string,
  keyterms: string[],
): Promise<InterpretationSession> {
  const normalized = normalizeKeyterms(keyterms);
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("interpretation_sessions")
    .update({ keyterms: normalized.length ? normalized : null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const session = rowToSession(data);
  if (session.roomId) {
    await notifyStreamServer("/internal/sessions/update-keyterms", {
      ...streamSessionPayload(session),
      keyterms: normalized,
    });
  }

  return session;
}

export async function stopSession(id: string): Promise<InterpretationSession> {
  const existing = await getSession(id);
  if (!existing) throw new Error("세션이 존재하지 않습니다.");

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("interpretation_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (existing.roomId) {
    await notifyStreamServer("/internal/sessions/stop", {
      roomId: existing.roomId,
      reason: "admin_stop",
    });
  }

  return data ? rowToSession(data) : existing;
}
