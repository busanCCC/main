-- user_info.is_admin 은 관리자 API(service role)의 권한 판정 기준이다.
-- user_info 는 RLS 가 꺼져 있고 anon/authenticated 에 테이블 단위 INSERT/UPDATE 가 부여돼 있어
-- 공개 anon 키만으로 누구나 is_admin 을 true 로 바꿀 수 있었다.
-- 클라이언트(anon/authenticated 역할)의 is_admin 변경만 차단하고,
-- service role · 대시보드(postgres) · SECURITY DEFINER 함수의 변경은 그대로 허용한다.
-- 테이블 단위 권한이 있으면 컬럼 단위 REVOKE 는 효과가 없으므로 트리거로 막는다.

create or replace function public.protect_user_info_is_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and coalesce(new.is_admin, false) then
      raise exception 'is_admin cannot be set by clients'
        using errcode = '42501';
    elsif tg_op = 'UPDATE' and new.is_admin is distinct from old.is_admin then
      raise exception 'is_admin cannot be changed by clients'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_user_info_is_admin on public.user_info;
create trigger protect_user_info_is_admin
  before insert or update on public.user_info
  for each row execute function public.protect_user_info_is_admin();
