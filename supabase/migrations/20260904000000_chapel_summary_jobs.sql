-- 채플 요약 LLM 생성 작업 큐
-- chapel_summaries(최종 콘텐츠)와 별개로, 비동기 생성 상태만 추적한다.
-- lib/chapel-summary/jobs.ts 에서 service role 로만 접근한다.

create table if not exists public.chapel_summary_jobs (
  id uuid not null default gen_random_uuid (),
  created_by uuid null,
  status text not null default 'queued'::text,
  input jsonb not null,
  result jsonb null,
  error text null,
  created_at timestamp with time zone not null default now(),
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  constraint chapel_summary_jobs_pkey primary key (id),
  constraint chapel_summary_jobs_created_by_fkey foreign KEY (created_by) references auth.users (id) on delete set null,
  constraint chapel_summary_jobs_status_check check (
    (
      status = any (
        array[
          'queued'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists chapel_summary_jobs_status_idx on public.chapel_summary_jobs using btree (status, created_at desc) TABLESPACE pg_default;

create index IF not exists chapel_summary_jobs_created_by_idx on public.chapel_summary_jobs using btree (created_by) TABLESPACE pg_default;

-- service role 로만 접근하므로 정책 없이 RLS 를 켜서 anon/authenticated 접근을 차단한다.
alter table public.chapel_summary_jobs enable row level security;
