import { DialogTitle } from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "../ui/dialog";
import Prayer from "@/app/components/worship-order/Prayer";
import { PrayType } from "@/app/types/worship";
import { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { supabase } from "@/api/supabase";

type prop = {
  id: number;
  prayType: string;
  openingprayer?: string;
  generalprayer?: string;
  offeringprayer?: string;
  testimonyprayer?: string;
  displaytext?: string;
  refreshEvent: () => void;
};

export default function SetPrayerDialog({
  id,
  prayType,
  openingprayer,
  generalprayer,
  offeringprayer,
  testimonyprayer,
  displaytext,
  refreshEvent,
}: prop) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(openingprayer);
  const [general, setGeneral] = useState(generalprayer);
  const [offering, setOffering] = useState(offeringprayer);
  const [testimony, setTestimony] = useState(testimonyprayer);

  useEffect(() => {
    if (open) {
      setOpening(openingprayer ?? "");
      setGeneral(generalprayer ?? "");
      setOffering(offeringprayer ?? "");
      setTestimony(testimonyprayer ?? "");
    }
  }, [open, openingprayer, generalprayer, offeringprayer, testimonyprayer]);

  // Supabase 업데이트 함수
  const handleUpdate = async () => {
    const { error } = await supabase
      .from("posts") // 업데이트할 테이블 이름
      .update({
        openingprayer: opening,
        generalprayer: general,
        offeringprayer: offering,
        testimonyprayer: testimony,
      })
      .eq("id", id); // 특정 ID에 해당하는 데이터를 업데이트

    if (error) {
      console.error("업데이트 실패:", error);
      alert("업데이트에 실패했습니다.");
    } else {
      alert("업데이트 성공!");
      refreshEvent();
      setOpen(false); // 다이얼로그 닫기
    }
  };
  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer" onClick={() => setOpen(true)}>
            <Prayer
              prayType={prayType as PrayType}
              prayer={displaytext || ""}
              className="mt-24"
            />
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기도자 수정</DialogTitle>
          </DialogHeader>
          <div className="flex-col space-y-4">
            <div className="flex-col space-y-1">
              <Label>시작 기도자</Label>
              <Input
                id="openingPrayer"
                type="text"
                onChange={(e) => setOpening(e.target.value)}
                placeholder={openingprayer || "이름을 입력하세요"}
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>대표 기도자</Label>
              <Input
                id="generalPrayer"
                type="text"
                onChange={(e) => setGeneral(e.target.value)}
                placeholder={generalprayer || "이름을 입력하세요"}
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>헌금 기도자</Label>
              <Input
                id="offeringPrayer"
                type="text"
                onChange={(e) => setOffering(e.target.value)}
                placeholder={offeringprayer || "이름을 입력하세요"}
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>간증자</Label>
              <Input
                id="testimonyPrayer"
                type="text"
                onChange={(e) => setTestimony(e.target.value)}
                placeholder={testimonyprayer || "이름을 입력하세요"}
              />
            </div>
            <div className="flex justify-between">
              <DialogClose asChild>
                <Button variant="outline">취소</Button>
              </DialogClose>
              <Button onClick={handleUpdate}>수정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
