-- daily_devotions 테이블에 YouTube(풍삶) 영상 메타데이터 컬럼 추가
-- RN 앱은 date 컬럼으로 1건 조회 후 아래 컬럼을 사용하여 풍삶 영상을 노출합니다.

alter table public.daily_devotions
  add column if not exists youtube_channel_id text,
  add column if not exists youtube_video_id text,
  add column if not exists youtube_url text,
  add column if not exists youtube_title text,
  add column if not exists youtube_thumbnail_url text,
  add column if not exists youtube_published_at timestamptz,
  add column if not exists youtube_fetched_at timestamptz;

-- 중복 방지를 위한 보조 인덱스 (선택)
create index if not exists idx_daily_devotions_youtube_video_id
  on public.daily_devotions (youtube_video_id);

