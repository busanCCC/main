import type { TranscriptSegment } from "./transcript";

export type { TranscriptSegment };

export interface ChapelChapter {
  start_seconds: number;
  title: string;
  summary: string;
}

export interface ChapelActionPoint {
  title: string;
  detail: string;
}

/** Claude 가 만들어 주는 요약 초안. 운영진이 손본 뒤 DB로 들어간다 */
export interface ChapelSummaryDraft {
  title: string;
  topic: string;
  messenger: string;
  scripture_reference: string;
  scripture_text: string;
  summary: string;
  key_points: string[];
  chapters: ChapelChapter[];
  application_questions: string[];
  action_points: ChapelActionPoint[];
}

export interface ChapelSummaryRecord extends ChapelSummaryDraft {
  id: string;
  chapel_id: number | null;
  youtube_video_id: string;
  youtube_url: string;
  video_title: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  chapel_date: string | null;
  transcript: TranscriptSegment[];
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
