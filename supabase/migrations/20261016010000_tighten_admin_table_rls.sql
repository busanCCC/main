-- 관리 테이블 쓰기 권한을 관리자로 제한한다.
--
-- /api/admin 은 service role 로 쓰므로 RLS 와 무관하게 동작한다.
-- 문제는 anon 키로 PostgREST 에 직접 붙는 경로였다.
--   1) chapels, sports_* 는 "로그인한 아무 사용자"에게 쓰기가 열려 있었다.
--   2) 아래 테이블은 RLS 가 꺼져 있어 anon 키만으로 쓰기가 가능했다.
--      conference_notices, contest_entries, daily_devotions,
--      summer_conference_prayer_topics, posts, staff_info, weekly_bulletins
--
-- 선행 조건: 앱 저장소의 20261013_profiles_role_guard.sql (profiles.role 자가 변경 차단)이
-- 적용돼 있어야 한다. 없으면 누구나 role 을 ADMIN 으로 바꿔 is_app_admin() 을 통과한다.
--
-- 관리자 판정은 두 출처를 모두 인정한다.
--   - profiles.role (ADMIN/DEVELOPER): 앱에서 쓰는 기존 정책들의 기준
--   - user_info.is_admin: 웹 관리자 기준 (protect_user_info_is_admin 트리거로 보호)
-- 읽기는 기존처럼 공개로 둔다.

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1 from public.profiles
            where id = auth.uid() and role in ('ADMIN', 'DEVELOPER')
         )
      or exists (
           select 1 from public.user_info
            where id = auth.uid() and is_admin
         );
$$;

revoke all on function public.is_app_admin() from public;
revoke all on function public.is_app_admin() from anon;
grant execute on function public.is_app_admin() to authenticated;

-- --- 0) 카운트 트리거 함수 ---
-- 좋아요·댓글 트리거가 호출자 권한으로 contest_entries / posts 의 카운트를 갱신한다.
-- RLS 를 켜면 일반 사용자의 UPDATE 가 오류 없이 0행 처리되어 카운트가 멈추므로,
-- 함수 소유자 권한으로 실행되게 바꾼다. (트리거 함수는 직접 호출할 수 없다)

alter function public.increment_contest_likes() security definer set search_path = public;
alter function public.decrement_contest_likes() security definer set search_path = public;
alter function public.update_post_likes_count() security definer set search_path = public;
alter function public.update_post_comments_count() security definer set search_path = public;

-- --- 1) 로그인 사용자 전체에 열려 있던 쓰기 정책 교체 ---

drop policy if exists chapels_insert on public.chapels;
drop policy if exists chapels_update on public.chapels;
drop policy if exists chapels_delete on public.chapels;
drop policy if exists chapels_write_admin on public.chapels;
create policy chapels_write_admin on public.chapels
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "auth update tournaments" on public.sports_tournaments;
drop policy if exists sports_tournaments_write_admin on public.sports_tournaments;
create policy sports_tournaments_write_admin on public.sports_tournaments
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "auth update matches" on public.sports_matches;
drop policy if exists sports_matches_write_admin on public.sports_matches;
create policy sports_matches_write_admin on public.sports_matches
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "auth update participants" on public.sports_participants;
drop policy if exists sports_participants_write_admin on public.sports_participants;
create policy sports_participants_write_admin on public.sports_participants
  for all to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- --- 2) RLS 가 꺼져 있던 테이블: 공개 읽기 + 관리자 쓰기 ---

do $$
declare
  t text;
begin
  foreach t in array array[
    'conference_notices',
    'contest_entries',
    'daily_devotions',
    'summer_conference_prayer_topics',
    'posts',
    'staff_info',
    'weekly_bulletins'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_read_all', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_read_all', t
    );

    execute format('drop policy if exists %I on public.%I', t || '_write_admin', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using (public.is_app_admin()) with check (public.is_app_admin())',
      t || '_write_admin', t
    );
  end loop;
end;
$$;
