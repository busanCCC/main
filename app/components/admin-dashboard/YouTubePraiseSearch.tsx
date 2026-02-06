"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, Music } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import { SEARCH_DEBOUNCE_MS } from "@/app/(pages)/admin-dashboard/table-config";

// --- 타입 정의 ---
export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

interface YouTubeSearchResult {
  ok: true;
  data: YouTubeVideo[];
  nextPageToken: string | null;
}

interface YouTubeSearchError {
  ok: false;
  reason: string;
}

interface YouTubePraiseSearchProps {
  onSelect: (video: YouTubeVideo) => void;
  selectedVideoIds?: string[];
}

// --- YouTube 검색 API 호출 함수 (Predictability: 일관된 반환) ---
async function searchYouTube(
  query: string,
  pageToken?: string | null
): Promise<YouTubeSearchResult | YouTubeSearchError> {
  let url = `/api/youtube-search?q=${encodeURIComponent(query)}`;
  if (pageToken) {
    url += `&pageToken=${encodeURIComponent(pageToken)}`;
  }
  const response = await fetch(url);
  const result = await response.json();
  return result;
}

// --- 검색 결과 카드 (Separating Code Paths) ---
function SearchResultCard({
  video,
  isSelected,
  onSelect,
}: {
  video: YouTubeVideo;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isSelected}
      className={`flex items-start gap-3 w-full rounded-lg border p-3 text-left transition-colors ${
        isSelected
          ? "border-primary/30 bg-primary/5 opacity-60 cursor-not-allowed"
          : "hover:border-primary/50 hover:bg-accent cursor-pointer"
      }`}
    >
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-28 h-20 rounded-md object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium line-clamp-2"
          dangerouslySetInnerHTML={{ __html: video.title }}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {video.channelTitle}
        </p>
        {isSelected && (
          <span className="text-xs text-primary mt-1 inline-block">
            이미 선택됨
          </span>
        )}
      </div>
    </button>
  );
}

// --- 메인 검색 컴포넌트 ---
export function YouTubePraiseSearch({
  onSelect,
  selectedVideoIds = [],
}: YouTubePraiseSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // IntersectionObserver 센티넬 ref
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // 추가 로드 중복 방지
  const isLoadingMoreRef = useRef(false);

  // 디바운스 (SEARCH_DEBOUNCE_MS 상수 재사용)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // 초기 검색 실행 (검색어 변경 시 결과 초기화)
  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setResults([]);
      setHasSearched(false);
      setNextPageToken(null);
      return;
    }

    async function performSearch() {
      setIsLoading(true);
      setNextPageToken(null);
      const result = await searchYouTube(debouncedQuery);
      if (result.ok) {
        setResults(result.data);
        setNextPageToken(result.nextPageToken);
      } else {
        setResults([]);
        setNextPageToken(null);
      }
      setHasSearched(true);
      setIsLoading(false);
    }

    performSearch();
  }, [debouncedQuery]);

  // 추가 페이지 로드
  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !nextPageToken || !debouncedQuery.trim()) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    const result = await searchYouTube(debouncedQuery, nextPageToken);
    if (result.ok) {
      setResults((prev) => [...prev, ...result.data]);
      setNextPageToken(result.nextPageToken);
    }

    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;
  }, [nextPageToken, debouncedQuery]);

  // IntersectionObserver로 센티넬 감지
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const isVideoSelected = useCallback(
    (videoId: string) => selectedVideoIds.includes(videoId),
    [selectedVideoIds]
  );

  const hasMore = nextPageToken !== null;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="YouTube에서 찬양을 검색하세요..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 초기 로딩 상태 */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <Skeleton className="w-28 h-20 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 검색 결과 + 무한 스크롤 */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {results.map((video) => (
            <SearchResultCard
              key={video.videoId}
              video={video}
              isSelected={isVideoSelected(video.videoId)}
              onSelect={() => onSelect(video)}
            />
          ))}

          {/* 추가 로딩 스피너 */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground ml-2">
                더 불러오는 중...
              </span>
            </div>
          )}

          {/* 모든 결과 로드 완료 */}
          {!hasMore && !isLoadingMore && results.length > 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              모든 결과를 불러왔습니다.
            </p>
          )}

          {/* IntersectionObserver 센티넬 */}
          {hasMore && <div ref={sentinelRef} className="h-1" />}
        </div>
      )}

      {/* 빈 결과 */}
      {!isLoading && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <Music className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
