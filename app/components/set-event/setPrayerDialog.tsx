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
import { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type prop = {
  prayType: string;
  prayer: string;
};

export default function SetPrayerDialog({ prayType, prayer }: prop) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer" onClick={() => setOpen(true)}>
            <Prayer
              prayType={prayType as PrayType}
              prayer={prayer}
              className="mt-24"
            />
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>내용 수정</DialogTitle>
          </DialogHeader>
          <div className="flex-col space-y-4">
            <div className="flex-col space-y-1">
              <Label>시작 기도자</Label>
              <Input
                id="openingPrayer"
                type="text"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>대표 기도자</Label>
              <Input
                id="generalPrayer"
                type="text"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>헌금 기도자</Label>
              <Input
                id="offeringPrayer"
                type="text"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>간증자</Label>
              <Input
                id="testimonyPrayer"
                type="text"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="flex justify-between">
              <DialogClose asChild>
                <Button variant="outline">취소</Button>
              </DialogClose>
              <Button>수정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
