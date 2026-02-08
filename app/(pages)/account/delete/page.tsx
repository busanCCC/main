"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { AlertTriangle } from "lucide-react";

export default function AccountDeletePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState("");

  const supabase = createClient();

  const handleConfirmOpenChange = (open: boolean) => {
    setConfirmOpen(open);
    if (!open) setEmailConfirm("");
  };

  useEffect(() => {
    async function fetchUser() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser({ email: u.email ?? undefined });
      setLoading(false);
    }
    fetchUser();
  }, [supabase, router]);

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);

    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const json = await res.json();

      if (!json.ok) {
        setError(json.reason ?? "계정 삭제에 실패했습니다.");
        setDeleting(false);
        return;
      }

      handleConfirmOpenChange(false);
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError("계정 삭제 중 오류가 발생했습니다.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-slate-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            계정 탈퇴
          </CardTitle>
          <CardDescription>
            회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.email && (
            <p className="text-sm text-muted-foreground">
              현재 계정: <span className="font-medium text-foreground">{user.email}</span>
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" asChild className="flex-1">
            <Link href="/">취소</Link>
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => handleConfirmOpenChange(true)}
          >
            계정 삭제
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={handleConfirmOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>최종 확인</DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
              아래에 표시된 이메일을 정확히 입력하면 탈퇴가 진행됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}
            {user?.email && (
              <p className="text-sm font-medium text-foreground">
                이메일: <span className="text-destructive">{user.email}</span>
              </p>
            )}
            <Input
              type="email"
              placeholder="위 이메일을 정확히 입력하세요"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleConfirmOpenChange(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || emailConfirm !== (user?.email ?? "")}
            >
              {deleting ? "처리 중..." : "탈퇴하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
