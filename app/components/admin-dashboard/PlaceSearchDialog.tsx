"use client";

import { useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

export interface PlaceSearchResult {
  placeName: string;
  address: string;
  latitude: number;
  longitude: number;
  placeLink: string | null;
}

interface PlaceSearchDialogProps {
  /** 검색창 초기값 (보통 현재 입력된 장소명) */
  initialQuery?: string;
  onSelect: (result: PlaceSearchResult) => void;
}

/**
 * 카카오 로컬 API로 장소/주소를 검색해 좌표를 자동 입력하는 인라인 검색 패널.
 */
export function PlaceSearchDialog({ initialQuery = "", onSelect }: PlaceSearchDialogProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`);
      const data = await response.json();

      if (!data.ok) {
        setError(data.reason ?? "주소 검색에 실패했습니다.");
        setResults([]);
      } else {
        setResults(data.results as PlaceSearchResult[]);
      }
    } catch {
      setError("주소 검색 중 오류가 발생했습니다.");
      setResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  return (
    <div className="rounded-md border border-input bg-muted/30 p-3 space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // form submit 방지
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="장소명 또는 주소 검색 (예: 넘치는 교회)"
        />
        <Button type="button" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!error && hasSearched && results.length === 0 && !isSearching && (
        <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
      )}

      {results.length > 0 && (
        <ul className="max-h-64 overflow-y-auto space-y-1">
          {results.map((result, index) => (
            <li key={`${result.latitude},${result.longitude},${index}`}>
              <button
                type="button"
                onClick={() => onSelect(result)}
                className="w-full text-left rounded-md px-3 py-2 hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{result.placeName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {result.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
