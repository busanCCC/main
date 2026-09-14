-- 리트릿 기도제목 접근 제어
--
-- 메인 페이지("부산지구 기도제목")는 비로그인 방문자에게도 열려 있고
-- "🙏 기도할게요" CTA 도 로그인 없이 눌린다.
-- 그렇다고 anon 키에 이 테이블의 update/delete 를 열어주면 제목·본문까지 함께 열리므로,
-- RLS 를 켜서 정책 없이 두고 읽기/중보 카운트는 서버(/api/prayer-topics, service role)로만 처리한다.
-- 관리자 작성 경로(admin-dashboard/retreat-prayer → /api/admin)도 service role 이라 영향이 없다.

alter table public.chapel_prayer_topics enable row level security;

-- 중보 카운트 원자적 증가.
--
-- 리트릿 중에는 여러 명이 같은 기도제목을 동시에 누르므로
-- 애플리케이션에서 읽고-더하고-쓰면 클릭이 유실된다(동시 10회 중 1회 유실 확인).
-- DB 에서 한 문장으로 올려 유실을 없앤다.
-- 실행 권한은 service_role 에만 준다 → 공개 진입점은 rate limit 이 걸린 /api/prayer-topics 하나뿐.

create or replace function public.increment_chapel_prayer_topic_intercession(p_topic_id bigint)
returns integer
language sql
as $$
  update public.chapel_prayer_topics
     set intercession_count = intercession_count + 1
   where id = p_topic_id
  returning intercession_count;
$$;

revoke all on function public.increment_chapel_prayer_topic_intercession(bigint) from public;
revoke all on function public.increment_chapel_prayer_topic_intercession(bigint) from anon;
revoke all on function public.increment_chapel_prayer_topic_intercession(bigint) from authenticated;
grant execute on function public.increment_chapel_prayer_topic_intercession(bigint) to service_role;
