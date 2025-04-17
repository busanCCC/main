import { Button } from "../ui/button";
import MessagePassageDrawer from "./MessagePassageDrawer";
import { UserSearch } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/app/components/ui/hover-card";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "../ui/avatar";
import { useState } from "react";

type MessageProps = {
  title: string;
  passage?: string;
  messenger?: string;
  messengerInfo?: string;
  words?: string;
  disableDrawer?: boolean;
  className?: string;
};

export default function Message({
  title,
  passage,
  messenger,
  words,
  messengerInfo,
  disableDrawer = false, // 기본값 false - 활성화
  className = "",
}: MessageProps) {
  const [isOpen, setIsOpen] = useState(false); // ✅ 상태 관리 추가
  return (
    <div
      className={`flex flex-col justify-center items-center text-gray-800
    ${className}`}
    >
      <div className="font-light tracking-widest">메세지</div>
      <h3 className="gsans-bold text-2xl responsive-text">{title}</h3>
      {!disableDrawer ? (
        <MessagePassageDrawer passage={passage} words={words}>
          <div className="font-light underline cursor-pointer">{passage}</div>
        </MessagePassageDrawer>
      ) : (
        <div className="font-light">{passage}</div>
      )}
      <div className="font-extralight">
        <p className="flex gap-1 items-center">
          {messenger}
          <HoverCard open={isOpen} onOpenChange={setIsOpen}>
            <HoverCardTrigger asChild>
              <Button
                variant="link"
                size="icon"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                <UserSearch />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between">
                <Avatar>
                  <AvatarImage
                    src="https://github.com/vercel.png"
                    className="size-20"
                  />
                  <AvatarFallback>VC</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{messenger}</h4>
                  <p className="text-sm">{messengerInfo}</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </p>
      </div>
    </div>
  );
}
