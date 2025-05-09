"use client";

import AdminHeader from "@/app/components/admin/AdminHeader";
import { AdminNavigation } from "@/app/components/admin/AdminNavigation";
import Calendar from "@/app/components/Calendar";
import SetEventList from "@/app/components/set-event/setEventList";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Separator } from "@/app/components/ui/separator";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import supabase from "@/utils/supabase/client";

export default function AdminPage() {
  const [handleToggle, setToggle] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data, error } = await supabase
        .from("user_info")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (error || !data || !data.is_admin) {
        router.replace("/");
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  if (loading) return <div>로딩중...</div>;
  if (!isAdmin) return null;

  return (
    <div className="h-full w-full justify-items-center">
      <div className="w-full">
        <AdminHeader />
      </div>
      <div className="w-full px-2 overflow-auto">
        <AdminNavigation />
      </div>
      <div className="h-[200px] w-full flex items-center justify-center">
        <div className="justify-items-center space-y-2">
          <p className="text-2xl">이벤트</p>
          <div>
            <Button variant="outline" onClick={() => setToggle(!handleToggle)}>
              {handleToggle ? "리스트 보기" : "캘린더 보기"}
            </Button>
          </div>
          <div className="w-full h-full">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">그룹 QR 코드</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] justify-items-center">
                <DialogHeader>테스트</DialogHeader>
                <DialogDescription>
                  QR을 통해 바로 접속이 가능합니다.
                </DialogDescription>
                <img src="https://picsum.photos/300" />
                <DialogDescription className="font-light">
                  https://www.xxxxxxxxx.com
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex w-full justify-end">
        <Button
          className="mx-3 size-10"
          onClick={() => router.push("/admin-page/add-event")}
        >
          <Plus />
        </Button>
      </div>
      <div className="sm:min-w-[400px] md:min-w-[800px] h-full py-4 justify-items-center">
        {handleToggle ? <Calendar /> : <SetEventList />}
      </div>
    </div>
  );
}
