"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

/* --- 카카오 지도 SDK 중 실제로 쓰는 부분만 타입으로 선언 --- */

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  setBounds(bounds: unknown): void;
  relayout(): void;
}

interface KakaoMarker {
  setPosition(latlng: KakaoLatLng): void;
  getPosition(): KakaoLatLng;
  setMap(map: KakaoMap | null): void;
}

interface KakaoCircle {
  setPosition(latlng: KakaoLatLng): void;
  setRadius(radius: number): void;
  getBounds(): unknown;
  setMap(map: KakaoMap | null): void;
}

interface KakaoMapsNamespace {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  Marker: new (options: { position: KakaoLatLng; draggable?: boolean }) => KakaoMarker;
  Circle: new (options: {
    center: KakaoLatLng;
    radius: number;
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeStyle: string;
    fillColor: string;
    fillOpacity: number;
  }) => KakaoCircle;
  event: {
    addListener(target: unknown, type: string, handler: (...args: never[]) => void): void;
  };
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsNamespace };
  }
}

/** SDK는 페이지당 한 번만 로드한다 */
let sdkPromise: Promise<KakaoMapsNamespace> | null = null;

function loadKakaoMapsSdk(appKey: string): Promise<KakaoMapsNamespace> {
  if (window.kakao?.maps?.LatLng) {
    return Promise.resolve(window.kakao.maps);
  }

  if (!sdkPromise) {
    sdkPromise = new Promise<KakaoMapsNamespace>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
      script.async = true;
      script.onload = () => {
        const maps = window.kakao?.maps;
        if (!maps) {
          reject(new Error("SDK_NOT_AVAILABLE"));
          return;
        }
        maps.load(() => resolve(maps));
      };
      script.onerror = () => {
        sdkPromise = null; // 재시도 가능하도록 초기화
        reject(new Error("SDK_LOAD_FAILED"));
      };
      document.head.appendChild(script);
    });
  }

  return sdkPromise;
}

interface KakaoMapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  /** 출석 가능 반경 (m) — 지도에 원으로 표시 */
  radiusM: number;
  /** 마커를 드래그하거나 지도를 클릭해 좌표를 옮겼을 때 */
  onCoordinateChange?: (latitude: number, longitude: number) => void;
}

/**
 * 선택한 좌표와 출석 가능 반경을 카카오 지도로 미리 보여준다.
 * 마커를 끌거나 지도를 클릭하면 좌표가 갱신된다.
 */
export function KakaoMapPreview({
  latitude,
  longitude,
  radiusM,
  onCoordinateChange,
}: KakaoMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapsRef = useRef<KakaoMapsNamespace | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markerRef = useRef<KakaoMarker | null>(null);
  const circleRef = useRef<KakaoCircle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 좌표가 바뀌어도 리스너를 다시 달지 않도록 최신 콜백만 ref로 유지
  const onCoordinateChangeRef = useRef(onCoordinateChange);
  useEffect(() => {
    onCoordinateChangeRef.current = onCoordinateChange;
  }, [onCoordinateChange]);

  const hasCoordinates =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  // 지도 1회 생성
  useEffect(() => {
    if (!KAKAO_JS_KEY || !hasCoordinates || !containerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;

    loadKakaoMapsSdk(KAKAO_JS_KEY)
      .then((maps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const center = new maps.LatLng(latitude, longitude);
        const map = new maps.Map(containerRef.current, { center, level: 3 });
        const marker = new maps.Marker({ position: center, draggable: true });
        marker.setMap(map);

        const circle = new maps.Circle({
          center,
          radius: radiusM,
          strokeWeight: 2,
          strokeColor: "#2563eb",
          strokeOpacity: 0.8,
          strokeStyle: "solid",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
        });
        circle.setMap(map);

        maps.event.addListener(marker, "dragend", () => {
          const position = marker.getPosition();
          onCoordinateChangeRef.current?.(position.getLat(), position.getLng());
        });

        maps.event.addListener(map, "click", ((mouseEvent: { latLng: KakaoLatLng }) => {
          const position = mouseEvent.latLng;
          onCoordinateChangeRef.current?.(position.getLat(), position.getLng());
        }) as (...args: never[]) => void);

        mapsRef.current = maps;
        mapRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;

        // 컨테이너가 늦게 펼쳐진 경우 대비
        map.relayout();
        map.setCenter(center);
      })
      .catch(() => {
        if (!cancelled) setLoadError("지도를 불러오지 못했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [hasCoordinates, latitude, longitude, radiusM]);

  // 좌표를 비우면 지도 컨테이너가 언마운트된다.
  // 남아 있는 인스턴스는 떨어져 나간 DOM을 붙들고 있으므로 버리고 다음에 새로 만든다.
  useEffect(() => {
    if (hasCoordinates) return;
    markerRef.current?.setMap(null);
    circleRef.current?.setMap(null);
    mapsRef.current = null;
    mapRef.current = null;
    markerRef.current = null;
    circleRef.current = null;
  }, [hasCoordinates]);

  // 좌표 / 반경 변경 반영
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!maps || !map || !hasCoordinates) return;

    const center = new maps.LatLng(latitude, longitude);
    markerRef.current?.setPosition(center);
    circleRef.current?.setPosition(center);
    circleRef.current?.setRadius(radiusM);

    const bounds = circleRef.current?.getBounds();
    if (bounds) {
      map.setBounds(bounds);
    } else {
      map.setCenter(center);
    }
  }, [latitude, longitude, radiusM, hasCoordinates]);

  if (!KAKAO_JS_KEY) {
    return (
      <p className="text-xs text-muted-foreground">
        지도 미리보기를 쓰려면 NEXT_PUBLIC_KAKAO_JS_KEY가 필요합니다.
      </p>
    );
  }

  if (!hasCoordinates) {
    return (
      <div className="flex items-center justify-center gap-2 h-40 rounded-md border border-dashed border-input text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        좌표를 입력하면 지도에 표시됩니다.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-40 rounded-md border border-input text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div ref={containerRef} className="h-64 w-full rounded-md border border-input" />
      <p className="text-xs text-muted-foreground">
        파란 원이 출석 가능 반경({radiusM}m)입니다. 마커를 끌거나 지도를 클릭하면 좌표가
        바뀝니다.
      </p>
    </div>
  );
}
