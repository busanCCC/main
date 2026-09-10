-- 리트릿 기도제목
-- 채플(리트릿)마다 지구 전체(scope='district') / 캠퍼스별(scope='campus') 기도제목을 둔다.
-- admin-dashboard/retreat-prayer 에서 service role(/api/admin)로 작성한다.

create table if not exists public.chapel_prayer_topics (
  id bigint generated always as identity not null,
  chapel_id bigint not null,
  scope text not null,
  campus text null,
  title text not null,
  body text null,
  sort_order integer not null default 0,
  intercession_count integer not null default 0,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint chapel_prayer_topics_pkey primary key (id),
  constraint chapel_prayer_topics_chapel_id_fkey foreign KEY (chapel_id) references chapels (id) on delete CASCADE,
  constraint chapel_prayer_topics_created_by_fkey foreign KEY (created_by) references profiles (id) on delete set null,
  constraint chapel_prayer_topics_campus_check check (
    (
      (
        (scope = 'campus'::text)
        and (campus is not null)
        and (btrim(campus) <> ''::text)
      )
      or (
        (scope = 'district'::text)
        and (campus is null)
      )
    )
  ),
  constraint chapel_prayer_topics_scope_check check (
    (
      scope = any (array['district'::text, 'campus'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists chapel_prayer_topics_chapel_idx on public.chapel_prayer_topics using btree (chapel_id, scope, sort_order) TABLESPACE pg_default;
