import { NextRequest, NextResponse } from "next/server";

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json";
const MAX_RESULTS = 8;

interface KakaoKeywordDocument {
  place_name: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  x: string; // 경도(longitude)
  y: string; // 위도(latitude)
}

interface KakaoAddressDocument {
  address_name: string;
  road_address: { address_name: string } | null;
  x: string;
  y: string;
}

/** 관리자 화면에서 선택 가능한 장소 후보 */
export interface GeocodeResult {
  /** 장소명 (주소 검색 결과는 주소가 그대로 들어감) */
  placeName: string;
  /** 도로명 주소 (없으면 지번 주소) */
  address: string;
  latitude: number;
  longitude: number;
  placeLink: string | null;
}

async function fetchKakao<T>(url: string, query: string): Promise<T[]> {
  const response = await fetch(
    `${url}?query=${encodeURIComponent(query)}&size=${MAX_RESULTS}`,
    {
      headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[Kakao Local API] 검색 실패:", response.status, errorBody);
    throw new Error(`Kakao Local API ${response.status}`);
  }

  const data = await response.json();
  return (data.documents ?? []) as T[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { ok: false, reason: "검색어를 입력해주세요." },
      { status: 400 }
    );
  }

  if (!KAKAO_REST_API_KEY) {
    return NextResponse.json(
      { ok: false, reason: "카카오 REST API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  let keywordDocs: KakaoKeywordDocument[] = [];
  let addressDocs: KakaoAddressDocument[] = [];

  try {
    // 장소명("넘치는 교회")과 주소("서울시 관악구 …") 둘 다 검색 가능하도록 병렬 조회
    [keywordDocs, addressDocs] = await Promise.all([
      fetchKakao<KakaoKeywordDocument>(KAKAO_KEYWORD_URL, query),
      fetchKakao<KakaoAddressDocument>(KAKAO_ADDRESS_URL, query),
    ]);
  } catch {
    return NextResponse.json(
      { ok: false, reason: "주소 검색에 실패했습니다." },
      { status: 502 }
    );
  }

  const results: GeocodeResult[] = [
    ...keywordDocs.map((doc) => ({
      placeName: doc.place_name,
      address: doc.road_address_name || doc.address_name,
      latitude: Number(doc.y),
      longitude: Number(doc.x),
      placeLink: doc.place_url || null,
    })),
    ...addressDocs.map((doc) => ({
      placeName: doc.road_address?.address_name || doc.address_name,
      address: doc.road_address?.address_name || doc.address_name,
      latitude: Number(doc.y),
      longitude: Number(doc.x),
      placeLink: null,
    })),
  ]
    .filter(
      (result) =>
        Number.isFinite(result.latitude) && Number.isFinite(result.longitude)
    )
    .slice(0, MAX_RESULTS);

  // 좌표 기준 중복 제거 (키워드/주소 검색 결과가 겹치는 경우)
  const deduped = results.filter(
    (result, index) =>
      results.findIndex(
        (other) =>
          other.latitude === result.latitude &&
          other.longitude === result.longitude
      ) === index
  );

  return NextResponse.json({ ok: true, results: deduped });
}
