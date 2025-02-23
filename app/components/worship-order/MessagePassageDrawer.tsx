import {
  Dialog,
  DialogContent,
  DialogDescription,
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
