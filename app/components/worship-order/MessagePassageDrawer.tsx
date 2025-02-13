import { Button } from "@/app/components/ui/button";
import useIsDesktop from "@/app/hooks/useIsDestop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/app/components/ui/drawer";
import { useEffect, useState } from "react";

type MessagePassageDrawerProps = {
  children: React.ReactNode;
  passage?: string;
  words?: string;
};

export default function MessagePassageDrawer({
  children,
  passage,
  words,
}: MessagePassageDrawerProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const [scrollY, setScrollY] = useState(0);

  // ✅ 모달이 열릴 때 스크롤 위치 저장 및 body 고정
  useEffect(() => {
    if (open) {
      setScrollY(window.scrollY); // 현재 스크롤 위치 저장
      document.body.style.position = "fixed"; // ✅ 스크롤 멈추기
      document.body.style.top = `-${window.scrollY}px`; // 현재 스크롤 위치 유지
      document.body.style.width = "100%";
    } else {
      document.body.style.position = ""; // 원래대로 복구
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY); // ✅ 원래 위치로 복구
    }
  }, [open]);
  // ✅ 상태 변경 함수 (모바일 & 데스크톱 모두 대응)
  const handleOpen = (value: boolean) => {
    setOpen(value);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{passage}</DialogTitle>
            {/* 개행 지키기 */}
            <DialogDescription className="whitespace-pre-line overflow-y-auto">
              {words}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{passage}</DrawerTitle>
          <DrawerDescription className="whitespace-pre-line overflow-y-auto">
            {words}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">닫기</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
