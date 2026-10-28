-- 리트릿을 채플과 다른 장소에서 진행하는 주를 위해 리트릿 전용 출석 위치를 둔다.
-- 모두 NULL 이면 채플 장소(place, latitude, longitude, attendance_radius_m)를 그대로 쓴다.
-- 기존 행·기존 앱은 영향이 없다 (새 컬럼은 전부 nullable, 기본값 없음).

alter table public.chapels
  add column if not exists retreat_place text,
  add column if not exists retreat_place_link text,
  add column if not exists retreat_latitude double precision,
  add column if not exists retreat_longitude double precision,
  add column if not exists retreat_attendance_radius_m integer;

comment on column public.chapels.retreat_place is
  '리트릿 장소명. NULL 이면 채플 장소(place)와 같음';
comment on column public.chapels.retreat_place_link is
  '리트릿 지도 링크. NULL 이면 채플 지도 링크(place_link)와 같음';
comment on column public.chapels.retreat_latitude is
  '리트릿 출석 판정 기준 위도. NULL 이면 채플 좌표(latitude)를 사용';
comment on column public.chapels.retreat_longitude is
  '리트릿 출석 판정 기준 경도. NULL 이면 채플 좌표(longitude)를 사용';
comment on column public.chapels.retreat_attendance_radius_m is
  '리트릿 출석 인정 반경(미터). NULL 이면 attendance_radius_m 을 사용';

-- 앱은 위도/경도가 둘 다 있을 때만 리트릿 좌표로 판정하므로 한쪽만 저장되는 것을 막는다
alter table public.chapels
  drop constraint if exists chapels_retreat_coords_paired;
alter table public.chapels
  add constraint chapels_retreat_coords_paired
  check ((retreat_latitude is null) = (retreat_longitude is null));

alter table public.chapels
  drop constraint if exists chapels_retreat_radius_positive;
alter table public.chapels
  add constraint chapels_retreat_radius_positive
  check (retreat_attendance_radius_m is null or retreat_attendance_radius_m > 0);
