import { NextRequest, NextResponse } from "next/server";

import {
  MAX_INCREMENT_BATCH,
  fetchLatestPrayerTopicBoard,
  getPrayerTopicClient,
  incrementIntercessionMany,
} from "@/lib/prayer-topics/server";

/**
 * 메인 페이지 "부산지구 기도제목" 섹션 전용 공개 API.
 *
 * chapel_prayer_topics / chapels 는 RLS 로 잠겨 있어 비로그인 방문자가 직접 읽거나 쓸 수 없다.
 * 여기서 service role 로 대신 처리하되, 노출은 읽기 + 중보 카운트 +1 두 가지로만 제한한다.
 * "기도할게요" 는 카드 단위 버튼이라 그 카드의 기도제목 id 를 한 번에 받는다.
 */

export const dynamic = "force-dynamic";

/** 비로그인 CTA 라 인증으로 막을 수 없어, IP 단위로 클릭 폭주만 걸러낸다 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    // 인스턴스가 오래 살아 있어도 만료된 항목이 쌓이지 않도록 청소한다
    if (rateLimitBuckets.size > 5_000) {
      rateLimitBuckets.forEach((value, key) => {
        if (value.resetAt <= now) rateLimitBuckets.delete(key);
      });
    }
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

export async function GET() {
  try {
    const board = await fetchLatestPrayerTopicBoard(getPrayerTopicClient());
    return NextResponse.json({ ok: true, data: board });
  } catch (error) {
    console.error("[prayer-topics] 조회 실패:", error);
    return NextResponse.json(
      { ok: false, reason: "기도제목을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (isRateLimited(clientIp(request))) {
    return NextResponse.json(
      { ok: false, reason: "잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  let topicIds: unknown;
  try {
    ({ topicIds } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, reason: "잘못된 요청입니다." }, { status: 400 });
  }

  const isValidBatch =
    Array.isArray(topicIds) &&
    topicIds.length > 0 &&
    topicIds.length <= MAX_INCREMENT_BATCH &&
    topicIds.every((id) => Number.isInteger(id) && (id as number) > 0);

  if (!isValidBatch) {
    return NextResponse.json(
      { ok: false, reason: "기도제목 ID가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  try {
    const result = await incrementIntercessionMany(
      getPrayerTopicClient(),
      Array.from(new Set(topicIds as number[]))
    );
    if (!result.ok) {
      return NextResponse.json({ ok: false, reason: result.reason }, { status: result.status });
    }
    return NextResponse.json({ ok: true, data: { counts: result.counts } });
  } catch (error) {
    console.error("[prayer-topics] 중보 기록 실패:", error);
    return NextResponse.json(
      { ok: false, reason: "기도를 기록하지 못했습니다." },
      { status: 500 }
    );
  }
}
