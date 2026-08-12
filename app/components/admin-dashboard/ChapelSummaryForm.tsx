"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Link2,
  Loader2,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { formatTimestamp } from "@/lib/chapel-summary/transcript";
import type {
  ChapelSummaryDraft,
  TranscriptSegment,
} from "@/lib/chapel-summary/types";
import {
  ActionPointListField,
  ChapterListField,
  StringListField,
  TextareaField,
  type ActionPointValue,
  type ChapterValue,
} from "./chapel-summary/ChapelSummaryFields";

/** 미리보기에 한 번에 보여줄 전사문 줄 수 */
const TRANSCRIPT_PREVIEW_ROWS = 12;

interface VideoMeta {
  videoId: string;
  url: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

interface FormState {
  youtube_url: string;
  chapel_date: string;
  title: string;
  topic: string;
  messenger: string;
  scripture_reference: string;
  scripture_text: string;
  summary: string;
  key_points: string[];
  chapters: ChapterValue[];
  application_questions: string[];
  action_points: ActionPointValue[];
  status: "draft" | "published";
}

const EMPTY_FORM: FormState = {
  youtube_url: "",
  chapel_date: "",
  title: "",
  topic: "",
  messenger: "",
  scripture_reference: "",
  scripture_text: "",
  summary: "",
  key_points: [],
  chapters: [],
  application_questions: [],
  action_points: [],
  status: "draft",
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toObjectArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toFormState(record?: Record<string, unknown>): FormState {
  if (!record) return EMPTY_FORM;

  const get = (key: string) => {
    const value = record[key];
    return value == null ? "" : String(value);
  };

  return {
    youtube_url: get("youtube_url"),
    chapel_date: get("chapel_date").slice(0, 10),
    title: get("title"),
    topic: get("topic"),
    messenger: get("messenger"),
    scripture_reference: get("scripture_reference"),
    scripture_text: get("scripture_text"),
    summary: get("summary"),
    key_points: toStringArray(record.key_points),
    chapters: toObjectArray<ChapterValue>(record.chapters),
    application_questions: toStringArray(record.application_questions),
    action_points: toObjectArray<ActionPointValue>(record.action_points),
    status: get("status") === "published" ? "published" : "draft",
  };
}

function toVideoMeta(record?: Record<string, unknown>): VideoMeta | null {
  if (!record?.youtube_video_id) return null;

  return {
    videoId: String(record.youtube_video_id),
    url: String(record.youtube_url ?? ""),
    title: String(record.video_title ?? ""),
    channelTitle: "",
    thumbnailUrl: String(record.thumbnail_url ?? ""),
    durationSeconds: Number(record.duration_seconds ?? 0),
    publishedAt: "",
  };
}

interface ChapelSummaryFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
  mode: "create" | "edit";
}

export function ChapelSummaryForm({
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting = false,
  mode,
}: ChapelSummaryFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(defaultValues));
  const [video, setVideo] = useState<VideoMeta | null>(() =>
    toVideoMeta(defaultValues)
  );
  const [transcript, setTranscript] = useState<TranscriptSegment[]>(() =>
    toObjectArray<TranscriptSegment>(defaultValues?.transcript)
  );
  const [rawTranscript, setRawTranscript] = useState("");

  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const patch = useCallback((next: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...next }));
  }, []);

  const transcriptDuration = useMemo(() => {
    if (video?.durationSeconds) return video.durationSeconds;
    return transcript.length > 0
      ? transcript[transcript.length - 1].end_seconds
      : 0;
  }, [video, transcript]);

  const handleLoadVideo = async () => {
    const url = form.youtube_url.trim();
    if (!url) {
      toast.error("유튜브 링크를 입력해주세요.");
      return;
    }

    setIsLoadingVideo(true);
    try {
      const response = await fetch(
        `/api/chapel-summary/video?url=${encodeURIComponent(url)}`
      );
      const result = await response.json();

      if (!result.ok) {
        toast.error(result.reason);
        return;
      }

      const meta = result.data as VideoMeta;
      setVideo(meta);
      // 제목이 비어 있을 때만 영상 제목으로 채운다. 손본 제목을 덮지 않는다
      setForm((current) => ({
        ...current,
        youtube_url: meta.url,
        title: current.title || meta.title,
      }));
      toast.success("영상 정보를 불러왔습니다.");
    } catch {
      toast.error("영상 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleParseTranscript = async () => {
    setIsParsing(true);
    try {
      const response = await fetch("/api/chapel-summary/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.youtube_url,
          raw: rawTranscript,
          durationSeconds: video?.durationSeconds ?? 0,
        }),
      });
      const result = await response.json();

      if (!result.ok) {
        toast.error(result.reason);
        return;
      }

      setTranscript(result.data.segments as TranscriptSegment[]);
      toast.success(
        `전사문 ${result.data.segments.length}개 구간을 읽었습니다.`
      );
    } catch {
      toast.error("전사문을 처리하지 못했습니다.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = async () => {
    if (transcript.length === 0) {
      toast.error("전사문을 먼저 준비해주세요.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/chapel-summary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          videoTitle: video?.title,
          messenger: form.messenger,
          topic: form.topic,
          chapelDate: form.chapel_date,
        }),
      });
      const result = await response.json();

      if (!result.ok) {
        toast.error(result.reason);
        return;
      }

      const draft = result.data as ChapelSummaryDraft;
      setForm((current) => ({
        ...current,
        title: draft.title || current.title,
        topic: draft.topic || current.topic,
        messenger: draft.messenger || current.messenger,
        scripture_reference: draft.scripture_reference,
        scripture_text: draft.scripture_text,
        summary: draft.summary,
        key_points: draft.key_points,
        chapters: draft.chapters,
        application_questions: draft.application_questions,
        action_points: draft.action_points,
      }));
      toast.success("요약 초안을 만들었습니다. 내용을 확인해주세요.");
    } catch {
      toast.error("요약 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!video) {
      toast.error("유튜브 영상을 먼저 불러와주세요.");
      return;
    }
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!form.summary.trim()) {
      toast.error("요약 본문을 입력해주세요.");
      return;
    }

    await onSubmit({
      youtube_video_id: video.videoId,
      youtube_url: video.url || form.youtube_url.trim(),
      video_title: video.title || null,
      thumbnail_url: video.thumbnailUrl || null,
      duration_seconds: video.durationSeconds || null,
      chapel_date: form.chapel_date || null,
      title: form.title.trim(),
      topic: form.topic.trim() || null,
      messenger: form.messenger.trim() || null,
      scripture_reference: form.scripture_reference.trim() || null,
      scripture_text: form.scripture_text.trim() || null,
      summary: form.summary.trim(),
      key_points: form.key_points.filter((point) => point.trim()),
      chapters: form.chapters.filter((chapter) => chapter.title.trim()),
      application_questions: form.application_questions.filter((question) =>
        question.trim()
      ),
      action_points: form.action_points.filter((point) => point.title.trim()),
      transcript,
      status: form.status,
    });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "채플 요약 생성" : "채플 요약 수정"}
          </h2>
          <p className="text-sm text-muted-foreground">
            유튜브 영상과 전사문으로 요약을 만들고, 확인한 뒤 게시합니다.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ── 1단계: 영상 ────────────────────────────────── */}
        <section className="space-y-4">
          <StepHeading step={1} title="유튜브 영상" />

          <div className="space-y-2">
            <Label htmlFor="youtube_url">영상 링크 *</Label>
            <div className="flex gap-2">
              <Input
                id="youtube_url"
                value={form.youtube_url}
                onChange={(event) => patch({ youtube_url: event.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadVideo}
                disabled={isLoadingVideo}
                className="shrink-0"
              >
                {isLoadingVideo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                불러오기
              </Button>
            </div>
          </div>

          {video && <VideoCard video={video} />}

          <div className="space-y-2">
            <Label htmlFor="chapel_date">채플 날짜</Label>
            <Input
              id="chapel_date"
              type="date"
              value={form.chapel_date}
              onChange={(event) => patch({ chapel_date: event.target.value })}
            />
          </div>
        </section>

        {/* ── 2단계: 전사문 ──────────────────────────────── */}
        <section className="space-y-4">
          <StepHeading step={2} title="전사문" />

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
            유튜브 영상 아래 <strong>[더보기 → 스크립트 표시]</strong> 를 눌러
            전사문을 열고, 전체를 복사해 아래에 붙여넣어 주세요. 타임스탬프가
            함께 복사되면 그대로 인식합니다. 타임스탬프가 없는 글도 받지만,
            영상 위치는 대략적으로만 맞습니다.
          </div>

          <TextareaField
            label="붙여넣은 전사문"
            value={rawTranscript}
            onChange={setRawTranscript}
            rows={8}
            placeholder={"0:12 오늘 함께 나눌 말씀은\n0:19 요한복음 3장입니다\n..."}
            monospace
          />

          <Button
            type="button"
            variant="outline"
            onClick={handleParseTranscript}
            disabled={isParsing}
          >
            {isParsing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            전사문 읽기
          </Button>

          {transcript.length > 0 && (
            <TranscriptPreview
              transcript={transcript}
              durationSeconds={transcriptDuration}
            />
          )}
        </section>

        {/* ── 3단계: AI 요약 ─────────────────────────────── */}
        <section className="space-y-4">
          <StepHeading step={3} title="요약 생성" />

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || transcript.length === 0}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? "생성 중… (1~3분)" : "AI 요약 생성"}
          </Button>
          <p className="text-xs text-muted-foreground">
            생성된 내용은 초안입니다. 아래에서 확인하고 고친 뒤 저장해주세요.
          </p>
        </section>

        {/* ── 4단계: 내용 확인 ───────────────────────────── */}
        <section className="space-y-6">
          <StepHeading step={4} title="내용 확인" />

          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="설교의 핵심을 담은 한 줄"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">주제</Label>
              <Input
                id="topic"
                value={form.topic}
                onChange={(event) => patch({ topic: event.target.value })}
                placeholder="예: 하나님의 사랑"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="messenger">메신저</Label>
              <Input
                id="messenger"
                value={form.messenger}
                onChange={(event) => patch({ messenger: event.target.value })}
                placeholder="예: 김OO 간사님"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scripture_reference">말씀 구절</Label>
            <Input
              id="scripture_reference"
              value={form.scripture_reference}
              onChange={(event) =>
                patch({ scripture_reference: event.target.value })
              }
              placeholder="예: 요한복음 3:16-18"
            />
          </div>

          <TextareaField
            label="말씀 본문"
            value={form.scripture_text}
            onChange={(value) => patch({ scripture_text: value })}
            rows={3}
            placeholder="본문 말씀 내용"
          />

          <TextareaField
            label="요약 본문 *"
            value={form.summary}
            onChange={(value) => patch({ summary: value })}
            rows={10}
            hint="채플에 오지 못한 학생이 5분 안에 핵심을 붙잡을 수 있게 씁니다."
          />

          <StringListField
            label="핵심 포인트"
            values={form.key_points}
            onChange={(values) => patch({ key_points: values })}
            placeholder="한 문장으로"
            addLabel="추가"
          />

          <ChapterListField
            values={form.chapters}
            onChange={(values) => patch({ chapters: values })}
            formatTimestamp={formatTimestamp}
          />

          <StringListField
            label="적용 질문"
            hint="한 주 동안 스스로에게 물어볼 질문입니다."
            values={form.application_questions}
            onChange={(values) => patch({ application_questions: values })}
            placeholder="예/아니오로 끝나지 않는 질문으로"
            addLabel="추가"
            multiline
          />

          <ActionPointListField
            values={form.action_points}
            onChange={(values) => patch({ action_points: values })}
          />
        </section>

        {/* ── 5단계: 게시 ────────────────────────────────── */}
        <section className="space-y-4">
          <StepHeading step={5} title="게시" />

          <div className="flex gap-3">
            <StatusToggle
              label="초안"
              description="앱에 보이지 않습니다"
              active={form.status === "draft"}
              onClick={() => patch({ status: "draft" })}
            />
            <StatusToggle
              label="게시"
              description="앱 채플 탭에 노출됩니다"
              active={form.status === "published"}
              onClick={() => patch({ status: "published" })}
            />
          </div>
        </section>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === "create" ? "생성" : "저장"}
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-2 border-b">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
        {step}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

function VideoCard({ video }: { video: VideoMeta }) {
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      {video.thumbnailUrl && (
        // 유튜브 CDN 도메인을 next.config 에 등록하지 않아도 되도록 img 를 쓴다
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-16 w-28 shrink-0 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{video.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {video.channelTitle}
          {video.durationSeconds > 0 &&
            ` · ${formatTimestamp(video.durationSeconds)}`}
        </p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          {video.videoId}
        </p>
      </div>
    </div>
  );
}

interface TranscriptPreviewProps {
  transcript: TranscriptSegment[];
  durationSeconds: number;
}

function TranscriptPreview({
  transcript,
  durationSeconds,
}: TranscriptPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded
    ? transcript
    : transcript.slice(0, TRANSCRIPT_PREVIEW_ROWS);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <p className="text-xs text-muted-foreground">
          {transcript.length}개 구간
          {durationSeconds > 0 && ` · ${formatTimestamp(durationSeconds)}`}
        </p>
        {transcript.length > TRANSCRIPT_PREVIEW_ROWS && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? "접기" : "전체 보기"}
          </Button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto divide-y">
        {visible.map((segment, index) => (
          <div key={index} className="flex gap-3 px-3 py-1.5 text-sm">
            <span className="shrink-0 w-14 text-xs text-muted-foreground tabular-nums pt-0.5">
              {formatTimestamp(segment.start_seconds)}
            </span>
            <span className="min-w-0">{segment.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StatusToggleProps {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

function StatusToggle({
  label,
  description,
  active,
  onClick,
}: StatusToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border p-3 text-left transition-colors ${
        active ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-2">
        {active && <Check className="h-4 w-4 text-primary" />}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
