/**
 * 세션 하나가 지금까지 쌓은 문맥.
 *
 * 스트림 서버의 번역은 세그먼트를 본다. 이 저장소는 세션을 본다 — 그 차이가
 * 오역을 줄이는 지점이다. 한국어는 주어를 생략하고 지시대명사가 앞 문장에 걸려서,
 * 세그먼트만 보는 번역기는 구조적으로 이걸 못 푼다. 정보가 그 밖에 있기 때문이다.
 *
 * 정확도만큼 중요한 것이 일관성이다. 같은 용어가 5분 전과 다르게 나오면
 * 듣는 사람에게는 그 자체가 오역이다. decisions 가 그걸 붙잡아 둔다.
 *
 * 전부 프로세스 메모리에 산다. 세션이 끝나면 가치가 급락하고, 서버가 재시작하면
 * 다음 발화부터 다시 쌓인다 — 정제는 없으면 초안을 읽는 선택적 계층이므로
 * 잃어도 송출은 멈추지 않는다.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as sessions from "./supabaseSessions";

/** 요약을 이 간격으로 새로 뜬다. 발화 경로를 막지 않도록 백그라운드로 돈다 */
const SUMMARY_INTERVAL_MS = 180_000;
/** 요약을 시작하는 최소 분량 */
const SUMMARY_MIN_PAIRS = 12;
/** 메모리 상한. 1시간 설교면 300쌍 안팎이다 */
const MAX_PAIRS = 500;
/** 프롬프트에 그대로 싣는 직전 문맥 */
const RECENT_PAIRS = 6;

const FAST_MODEL = process.env.INTERPRETATION_REFINE_MODEL || "claude-haiku-4-5-20251001";

export interface SpokenPair {
  source: string;
  spoken: string;
  lang: string;
}

interface SessionContext {
  sessionId: string;
  title: string;
  speaker: string;
  description: string;
  sourceLang: string;
  keyterms: string[];
  pairs: SpokenPair[];
  /** 용어 → 이 세션에서 확정한 번역. 다음 발화부터 강제된다 */
  decisions: Map<string, string>;
  summary: string;
  summaryAt: number;
  summarizing: boolean;
  loadedAt: number;
}

const store = new Map<string, SessionContext>();

export async function getContext(sessionId: string): Promise<SessionContext> {
  const existing = store.get(sessionId);
  if (existing) return existing;

  let title = "";
  let speaker = "";
  let description = "";
  let sourceLang = "ko";
  let keyterms: string[] = [];

  try {
    const session = await sessions.getSession(sessionId);
    if (session) {
      title = session.title ?? "";
      speaker = session.speaker ?? "";
      description = session.description ?? "";
      sourceLang = session.sourceLanguage ?? "ko";
      keyterms = session.keyterms ?? [];
    }
  } catch (err) {
    // 세션 메타를 못 읽어도 정제는 직전 문맥만으로 돌아간다
    console.warn("[통역 정제] 세션 메타 로드 실패:", err);
  }

  const context: SessionContext = {
    sessionId,
    title,
    speaker,
    description,
    sourceLang,
    keyterms,
    pairs: [],
    decisions: new Map(),
    summary: "",
    summaryAt: 0,
    summarizing: false,
    loadedAt: Date.now(),
  };

  store.set(sessionId, context);
  return context;
}

export function dropContext(sessionId: string) {
  store.delete(sessionId);
}

export function recordSpoken(context: SessionContext, pair: SpokenPair) {
  context.pairs.push(pair);
  if (context.pairs.length > MAX_PAIRS) {
    context.pairs.splice(0, context.pairs.length - MAX_PAIRS);
  }
}

export function recordDecisions(
  context: SessionContext,
  decisions: { term: string; chosen: string }[],
) {
  for (const decision of decisions) {
    const term = decision.term?.trim();
    const chosen = decision.chosen?.trim();
    if (!term || !chosen) continue;
    context.decisions.set(term, chosen);
  }
}

/**
 * 거의 변하지 않는 부분. 프롬프트 캐시 프리픽스로 쓰라고 따로 뽑는다 —
 * 이 층이 지연 예산 안에 들어갈 수 있는 이유가 이것이다.
 */
export function buildStablePrefix(context: SessionContext, lang: string): string {
  const lines: string[] = [];

  lines.push("# 이 통역 세션에 대하여");
  if (context.title) lines.push(`제목: ${context.title}`);
  if (context.speaker) lines.push(`발표자: ${context.speaker}`);
  if (context.description) lines.push(`설명: ${context.description}`);
  lines.push(`원어: ${context.sourceLang} → 통역: ${lang}`);

  if (context.keyterms.length > 0) {
    lines.push("");
    lines.push("# 이 세션에 나오는 고유명사·용어");
    lines.push(context.keyterms.join(", "));
  }

  if (context.summary) {
    lines.push("");
    lines.push("# 지금까지의 내용");
    lines.push(context.summary);
  }

  if (context.decisions.size > 0) {
    lines.push("");
    lines.push("# 이 세션에서 이미 확정한 번역 (반드시 그대로 쓴다)");
    for (const [term, chosen] of Array.from(context.decisions.entries())) {
      lines.push(`- ${term} → ${chosen}`);
    }
  }

  return lines.join("\n");
}

export function buildRecentContext(context: SessionContext, lang: string): string {
  const recent = context.pairs
    .filter((pair) => pair.lang === lang)
    .slice(-RECENT_PAIRS);

  if (recent.length === 0) return "(이번이 이 세션의 첫 발화다)";

  return recent
    .map((pair) => `원문: ${pair.source}\n통역: ${pair.spoken}`)
    .join("\n\n");
}

/**
 * 누적 요약을 갱신한다.
 *
 * 발화 경로에서 await 하지 않는다. 정제 요청이 들어올 때 유통기한만 확인하고
 * 백그라운드로 던진다 — 요약 때문에 소리가 늦으면 본말이 전도된다.
 */
export function refreshSummaryIfStale(context: SessionContext) {
  if (context.summarizing) return;
  if (context.pairs.length < SUMMARY_MIN_PAIRS) return;
  if (Date.now() - context.summaryAt < SUMMARY_INTERVAL_MS) return;
  if (!process.env.ANTHROPIC_API_KEY) return;

  context.summarizing = true;

  void (async () => {
    try {
      const client = new Anthropic();
      const transcript = context.pairs
        .map((pair) => pair.source)
        .filter(Boolean)
        .join("\n");

      const message = await client.messages.create({
        model: FAST_MODEL,
        max_tokens: 700,
        system:
          "통역 보조 시스템이다. 아래는 진행 중인 강연/설교의 원어 전사문이다. " +
          "이어질 문장을 통역할 때 참고할 문맥 노트를 만들어라. " +
          "주제, 등장하는 인물·지명·고유명사, 인용된 본문, 지금 다루는 논지를 " +
          "간결한 한국어 개조식으로 400자 이내로 정리한다. 새로운 내용을 지어내지 않는다.",
        messages: [{ role: "user", content: transcript.slice(-12_000) }],
      });

      const block = message.content.find((item) => item.type === "text");
      if (block && block.type === "text") {
        context.summary = block.text.trim();
        context.summaryAt = Date.now();
      }
    } catch (err) {
      console.warn("[통역 정제] 요약 갱신 실패:", err);
      // 다음 주기까지 재시도하지 않는다. 실패가 반복되면 매번 부하만 는다
      context.summaryAt = Date.now();
    } finally {
      context.summarizing = false;
    }
  })();
}

export type { SessionContext };
export { FAST_MODEL };
