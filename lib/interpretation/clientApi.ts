"use client";

import type {
  CreateSessionInput,
  InterpretationSession,
} from "@/lib/interpretation/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.reason ?? "요청에 실패했습니다.");
  }
  return json.data as T;
}

export async function fetchInterpretationSessions(): Promise<InterpretationSession[]> {
  return request<InterpretationSession[]>("/api/interpretation/sessions");
}

export async function fetchInterpretationSession(id: string): Promise<InterpretationSession> {
  return request<InterpretationSession>(`/api/interpretation/sessions/${id}`);
}

export async function createInterpretationSession(input: CreateSessionInput) {
  return request<{ id: string; roomId: string; streamUrl: string; status: string }>(
    "/api/interpretation/sessions",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) },
  );
}

export async function startInterpretationSession(id: string) {
  return request<{ started: boolean }>(`/api/interpretation/sessions/${id}/start`, {
    method: "POST",
  });
}

export async function stopInterpretationSession(id: string) {
  return request<{ stopped: boolean }>(`/api/interpretation/sessions/${id}/stop`, {
    method: "POST",
  });
}

export async function deleteInterpretationSession(id: string) {
  return request<{ deleted: boolean }>(`/api/interpretation/sessions/${id}`, {
    method: "DELETE",
  });
}

export async function updateInterpretationSessionKeyterms(id: string, keyterms: string[]) {
  return request<InterpretationSession>(`/api/interpretation/sessions/${id}/keyterms`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyterms }),
  });
}

export async function fetchStreamCredentials() {
  return request<{ token: string; streamUrl: string; monitorStreamUrl: string }>(
    "/api/interpretation/token",
  );
}

export async function fetchSessionParticipantStats(sessionId: string) {
  return request<{ total: number; byLang: Record<string, number> }>(
    `/api/interpretation/sessions/${sessionId}/stats`,
  );
}
