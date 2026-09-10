import { getAdminClient } from "./auth";
import { generateChapelSummary } from "./generate";
import type { GenerateSummaryInput } from "./prompt";
import type { ChapelSummaryDraft } from "./types";

export type ChapelSummaryJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export type ChapelSummaryJobInput = GenerateSummaryInput;

interface DbJobRow {
  id: string;
  created_by: string | null;
  status: ChapelSummaryJobStatus;
  input: ChapelSummaryJobInput;
  result: ChapelSummaryDraft | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ChapelSummaryJob {
  id: string;
  status: ChapelSummaryJobStatus;
  draft?: ChapelSummaryDraft;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

function rowToJob(row: DbJobRow): ChapelSummaryJob {
  return {
    id: row.id,
    status: row.status,
    draft: row.result ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function createChapelSummaryJob(
  input: ChapelSummaryJobInput,
  createdBy: string
): Promise<{ ok: true; jobId: string } | { ok: false; reason: string }> {
  if (input.transcript.length === 0) {
    return { ok: false, reason: "전사문을 먼저 준비해 주세요." };
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("chapel_summary_jobs")
    .insert({
      status: "queued",
      input,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      reason: error?.message ?? "작업을 만들지 못했습니다.",
    };
  }

  return { ok: true, jobId: data.id };
}

export async function getChapelSummaryJob(
  jobId: string
): Promise<ChapelSummaryJob | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("chapel_summary_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToJob(data as DbJobRow);
}

/** queued → processing 전환. 이미 처리 중이면 null */
export async function claimChapelSummaryJob(
  jobId: string
): Promise<DbJobRow | null> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("chapel_summary_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  if (error || !data) return null;
  return data as DbJobRow;
}

export async function completeChapelSummaryJob(
  jobId: string,
  draft: ChapelSummaryDraft
): Promise<void> {
  const supabase = getAdminClient();
  await supabase
    .from("chapel_summary_jobs")
    .update({
      status: "completed",
      result: draft,
      error: null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

export async function failChapelSummaryJob(
  jobId: string,
  reason: string
): Promise<void> {
  const supabase = getAdminClient();
  await supabase
    .from("chapel_summary_jobs")
    .update({
      status: "failed",
      error: reason,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/**
 * 아직 queued 인 job 만 failed 로 바꾼다.
 *
 * dispatch 가 실패했을 때 쓴다. 이미 processing 이후로 넘어갔다면 worker 가
 * 남긴 진짜 실패 사유가 있으므로 덮어쓰지 않는다.
 */
async function failQueuedChapelSummaryJob(
  jobId: string,
  reason: string
): Promise<void> {
  const supabase = getAdminClient();
  await supabase
    .from("chapel_summary_jobs")
    .update({
      status: "failed",
      error: reason,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .eq("status", "queued");
}

export async function processChapelSummaryJob(jobId: string): Promise<void> {
  const claimed = await claimChapelSummaryJob(jobId);
  if (!claimed) return;

  const result = await generateChapelSummary(claimed.input);

  if (result.ok) {
    await completeChapelSummaryJob(jobId, result.draft);
    return;
  }

  await failChapelSummaryJob(jobId, result.reason);
}

function getAppBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * 별도 Serverless Function invocation 으로 LLM 처리를 시작한다.
 *
 * dispatch 가 실패하면 job 은 영영 queued 로 남고 화면은 폴링만 하다 타임아웃된다.
 * 그래서 실패를 삼키지 않고 job 을 failed 로 내려서 사유가 화면에 뜨게 한다.
 */
export function dispatchChapelSummaryJob(jobId: string): void {
  const secret = process.env.CRON_SECRET;
  const baseUrl = getAppBaseUrl();
  const isDev = process.env.NODE_ENV === "development";

  if (!secret && !isDev) {
    console.error("[chapel-jobs] CRON_SECRET 이 없어 process 를 부를 수 없습니다.");
    void failQueuedChapelSummaryJob(
      jobId,
      "서버 설정 오류로 요약 작업을 시작하지 못했습니다. (CRON_SECRET 없음)"
    );
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  void fetch(`${baseUrl}/api/chapel-summary/jobs/process`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId }),
  })
    .then(async (response) => {
      // fetch 는 4xx/5xx 를 reject 하지 않는다. 직접 확인하지 않으면
      // worker 가 뜨지도 못한 실패가 조용히 묻힌다.
      if (response.ok) return;

      const detail = (await response.text().catch(() => "")).slice(0, 200);
      console.error(
        `[chapel-jobs] process 호출이 ${response.status} 로 실패했습니다:`,
        detail
      );
      await failQueuedChapelSummaryJob(
        jobId,
        `요약 작업을 시작하지 못했습니다. (worker 응답 ${response.status})`
      );
    })
    .catch(async (err) => {
      console.error("[chapel-jobs] process dispatch failed:", err);
      const reason = err instanceof Error ? err.message : String(err);
      await failQueuedChapelSummaryJob(
        jobId,
        `요약 작업을 시작하지 못했습니다. (${reason})`
      );
    });
}

export function verifyJobWorkerAuth(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  const token = (authHeader ?? "").replace(/^Bearer\s+/i, "");
  return token === secret;
}
