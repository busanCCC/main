-- user_info 에 RLS 를 켠 뒤 SELECT 정책이 없어 클라이언트가 자기 행도 읽지 못했다.
-- 관리자 페이지(admin-page, admin-dashboard)는 anon 키 세션으로 본인 is_admin 을 .single() 조회하므로
-- 0행 → 406(PGRST116) 이 나서 기존 관리자도 진입하지 못했다.
-- 본인 행만 읽도록 허용한다. (is_admin 변경은 protect_user_info_is_admin 트리거가 계속 차단)

drop policy if exists user_info_select_own on public.user_info;
create policy user_info_select_own on public.user_info
  for select to authenticated
  using (id = auth.uid());
