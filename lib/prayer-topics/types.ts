/** 메인 페이지 "부산지구 기도제목" 섹션이 쓰는 타입 (chapel_prayer_topics 기준) */

export interface PrayerTopicItem {
  id: number;
  title: string;
  body: string | null;
  intercessionCount: number;
}

export interface PrayerTopicGroup {
  /** 카드 key. 지구 전체는 "district", 캠퍼스는 "campus:<이름>" */
  key: string;
  /** 카드 제목. "지구 전체" 또는 캠퍼스명 */
  label: string;
  topics: PrayerTopicItem[];
}

export interface PrayerTopicChapel {
  id: number;
  topic: string | null;
  datetime: string | null;
  retreatDatetime: string | null;
}

/** 가장 최근 채플 1개의 기도제목을 지구/캠퍼스별로 묶은 결과 */
export interface PrayerTopicBoard {
  chapel: PrayerTopicChapel | null;
  groups: PrayerTopicGroup[];
}
