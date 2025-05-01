import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";

import { useState } from "react";

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
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] flex flex-col items-center">
        <DialogHeader>
          <DialogTitle>{passage}</DialogTitle>
          {/* 개행 지키기 */}
          <DialogDescription className="whitespace-pre-line overflow-y-auto">
            {words}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="text-sm text-stone-400">
          출처.대한성서공회
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
