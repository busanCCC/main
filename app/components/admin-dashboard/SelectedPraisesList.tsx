"use client";

import { X, GripVertical, Music } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { YouTubeVideo } from "./YouTubePraiseSearch";

interface SelectedPraisesListProps {
  praises: YouTubeVideo[];
  onRemove: (videoId: string) => void;
}

function SelectedPraiseCard({
  praise,
  onRemove,
}: {
  praise: YouTubeVideo;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <img
        src={praise.thumbnail}
        alt={praise.title}
        className="w-16 h-12 rounded object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          dangerouslySetInnerHTML={{ __html: praise.title }}
        />
        <p className="text-xs text-muted-foreground">{praise.channelTitle}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SelectedPraisesList({
  praises,
  onRemove,
}: SelectedPraisesListProps) {
  if (praises.length === 0) {
    return (
      <div className="flex flex-col items-center py-6 text-center rounded-lg border border-dashed">
        <Music className="h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          아직 선택된 찬양이 없습니다.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          위에서 YouTube 검색으로 찬양을 추가해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {praises.map((praise) => (
        <SelectedPraiseCard
          key={praise.videoId}
          praise={praise}
          onRemove={() => onRemove(praise.videoId)}
        />
      ))}
    </div>
  );
}
