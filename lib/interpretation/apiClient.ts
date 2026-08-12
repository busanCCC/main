import { CCC_API_URL } from "./constants";
import { createCccAdminToken } from "./devToken";
import type { ApiError, ApiResponse } from "./types";

function parseCccError(json: Record<string, unknown>, status: number): ApiError {
  if (json.success === false && json.error && typeof json.error === "object") {
    const err = json.error as { code?: string; message?: string };
    return {
      success: false,
      error: {
        code: err.code ?? "internal_error",
        message: err.message ?? `CCC API error (${status})`,
      },
    };
  }

  return {
    success: false,
    error: {
      code: "internal_error",
      message: typeof json.message === "string"
        ? json.message
        : `CCC API error (${status})`,
    },
  };
}

export async function cccFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const token = createCccAdminToken();

  try {
    const res = await fetch(`${CCC_API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    const json = (await res.json()) as Record<string, unknown>;

    if (json.success === true) {
      // 런타임 형태는 success 플래그로만 확인할 수 있다.
      // Record<string, unknown> 에서 곧바로 좁힐 수는 없어 unknown 을 거친다.
      return json as unknown as ApiResponse<T>;
    }

    return parseCccError(json, res.status);
  } catch (err) {
    return {
      success: false,
      error: {
        code: "internal_error",
        message: err instanceof Error
          ? `CCC API 연결 실패: ${err.message}`
          : "CCC API에 연결할 수 없습니다. localhost:3001 서버가 실행 중인지 확인하세요.",
      },
    };
  }
}
