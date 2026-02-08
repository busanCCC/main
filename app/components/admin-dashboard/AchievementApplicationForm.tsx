"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { ArrowLeft, Check, X, Loader2, ImageIcon } from "lucide-react";

interface AchievementApplicationFormProps {
  defaultValues: Record<string, unknown>;
  applicantInfo?: Record<string, unknown> | null;
  recordId: string;
  onSubmitSuccess: () => void;
  onBack: () => void;
}

const ACHIEVEMENT_LABELS: Record<string, string> = {
  nazareth: "나사렛",
  delegation: "대표단",
  general: "총대표단",
  leader: "순장",
  fasting: "수련회",
  yeosu: "여수",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "검토 중",
  approved: "승인",
  rejected: "거부",
};

const PROFILES_LABELS: Record<string, string> = {
  id: "사용자 ID",
  username: "이름",
  full_name: "성명",
  name: "이름",
  email: "이메일",
  phone: "전화번호",
  school_name: "학교명",
  student_id: "학번",
  avatar_url: "프로필 이미지",
  website: "웹사이트",
  updated_at: "수정일",
  created_at: "가입일",
  email_confirmed_at: "이메일 인증일",
  raw_user_meta_data: "메타데이터",
};

export function AchievementApplicationForm({
  defaultValues,
  applicantInfo,
  recordId,
  onSubmitSuccess,
  onBack,
}: AchievementApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const status = String(defaultValues.status ?? "pending");
  const achievementId = String(defaultValues.achievement_id ?? "");
  const proofUrls = (defaultValues.proof_image_urls as string[] | string) ?? [];
  const proofArray = Array.isArray(proofUrls)
    ? proofUrls
    : typeof proofUrls === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(proofUrls);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

  const handleReview = async (
    newStatus: "approved" | "rejected",
    reason?: string
  ) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const body: { status: string; rejection_reason?: string } = {
        status: newStatus,
      };
      if (newStatus === "rejected" && reason) {
        body.rejection_reason = reason;
      }
      const res = await fetch(
        `/api/admin/achievement-applications/${recordId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (json.ok) {
        setRejectDialogOpen(false);
        setRejectionReason("");
        onSubmitSuccess();
      } else {
        setError(json.reason ?? "처리 중 오류가 발생했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = () => {
    setError(null);
    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      setError("거부 사유를 입력해 주세요.");
      return;
    }
    handleReview("rejected", trimmed);
  };

  const isPending = status === "pending";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">업적 신청 상세</h1>
      </div>

      {/* 신청자 정보 (profiles) */}
      {applicantInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">신청자 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {(() => {
                const meta = applicantInfo.raw_user_meta_data as Record<string, unknown> | undefined;
                const entries = Object.entries(applicantInfo).filter(
                  ([key, value]) =>
                    value !== null &&
                    value !== undefined &&
                    key !== "raw_user_meta_data"
                );
                const rows: { label: string; value: string }[] = entries.map(
                  ([key, value]) => {
                    const label = PROFILES_LABELS[key] ?? key;
                    const displayValue =
                      typeof value === "boolean"
                        ? value
                          ? "예"
                          : "아니오"
                        : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value);
                    return { label, value: displayValue };
                  }
                );
                const nameFromMeta = meta?.username ?? meta?.name;
                if (
                  nameFromMeta &&
                  !applicantInfo.username &&
                  !applicantInfo.name &&
                  !applicantInfo.full_name
                ) {
                  rows.unshift({
                    label: "이름",
                    value: String(nameFromMeta),
                  });
                }
                return rows.map((row, i) => (
                  <div key={i}>
                    <span className="text-muted-foreground">{row.label}</span>
                    <p className="font-medium mt-1 break-all">{row.value}</p>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">신청 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">신청자 ID</span>
              <p className="font-mono text-xs mt-1 break-all">
                {String(defaultValues.user_id ?? "-")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">업적</span>
              <p className="font-medium mt-1">
                {ACHIEVEMENT_LABELS[achievementId] ?? achievementId}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">상태</span>
              <p className="font-medium mt-1">
                <span
                  className={
                    status === "approved"
                      ? "text-green-600"
                      : status === "rejected"
                        ? "text-destructive"
                        : "text-amber-600"
                  }
                >
                  {STATUS_LABELS[status] ?? status}
                </span>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">신청일</span>
              <p className="mt-1">
                {defaultValues.created_at
                  ? new Date(String(defaultValues.created_at)).toLocaleString(
                      "ko-KR"
                    )
                  : "-"}
              </p>
            </div>
          </div>

          {defaultValues.message != null && String(defaultValues.message).trim() !== "" ? (
            <div>
              <span className="text-muted-foreground text-sm">신청자 메모</span>
              <p className="mt-1 p-3 rounded-md bg-muted/50 text-sm">
                {String(defaultValues.message)}
              </p>
            </div>
          ) : null}

          {proofArray.length > 0 && (
            <div>
              <span className="text-muted-foreground text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                증명 사진 ({proofArray.length}장)
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {proofArray.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={url}
                      alt={`증명 ${i + 1}`}
                      className="h-24 w-24 object-cover rounded border hover:opacity-90 transition"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {defaultValues.reviewed_at != null ? (
            <div className="text-sm text-muted-foreground pt-2 border-t">
              검토일시:{" "}
              {new Date(String(defaultValues.reviewed_at)).toLocaleString(
                "ko-KR"
              )}
            </div>
          ) : null}

          {status === "rejected" &&
          defaultValues.rejection_reason != null &&
          String(defaultValues.rejection_reason).trim() !== "" ? (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <span className="text-sm font-medium text-destructive">
                거부 사유
              </span>
              <p className="mt-1 text-sm text-foreground">
                {String(defaultValues.rejection_reason)}
              </p>
            </div>
          ) : null}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}

          {isPending && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handleReview("approved")}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                승인
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setRejectionReason("");
                  setError(null);
                  setRejectDialogOpen(true);
                }}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                거부
              </Button>
            </div>
          )}

          {/* 거부 사유 입력 다이얼로그 */}
          <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>거부 사유</DialogTitle>
                <DialogDescription>
                  거부 사유를 입력해 주세요. 해당 내용은 신청자에게 전달됩니다.
                </DialogDescription>
              </DialogHeader>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="예: 증명 사진이 불명확합니다."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectConfirm}
                  disabled={isSubmitting || !rejectionReason.trim()}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  거부 확정
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
