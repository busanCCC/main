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
import { useState } from "react";

type MessagePassageDrawerProps = {
  children: React.ReactNode;
  passage: string;
  words: string;
};

export default function MessagePassageDrawer({
  children,
  passage,
  words,
}: MessagePassageDrawerProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
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
    <Drawer open={open} onOpenChange={setOpen}>
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
