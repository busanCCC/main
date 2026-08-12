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

/** 별도 Serverless Function invocation 으로 LLM 처리를 시작한다 */
export function dispatchChapelSummaryJob(jobId: string): void {
  const secret = process.env.CRON_SECRET;
  const baseUrl = getAppBaseUrl();
  const isDev = process.env.NODE_ENV === "development";

  if (!secret && !isDev) {
    console.warn(
      "[chapel-jobs] CRON_SECRET 이 없어 process 호출을 건너뜁니다."
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
  }).catch((err) => {
    console.error("[chapel-jobs] process dispatch failed:", err);
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
