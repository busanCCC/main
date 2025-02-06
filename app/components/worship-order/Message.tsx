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

type MessageProps = {
  title: string;
  passage?: string;
  messenger?: string;
  words?: string;
  className?: string;
};

export default function Message({
  title,
  passage,
  messenger,
  words,
  className = "",
}: MessageProps) {
  return (
    <div
      className={`flex flex-col justify-center items-center text-gray-800
    ${className}`}
    >
      <div className="font-light tracking-widest">메세지</div>
      <h3 className="gsans-bold text-2xl mt-2">{title}</h3>
      <MessagePassageDrawer passage={passage} words={words}>
        <div className="font-light underline cursor-pointer">{passage}</div>
      </MessagePassageDrawer>
      <div className="font-extralight">
        <p className="flex gap-1 items-center">
          {messenger}
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button
                variant="link"
                size="icon"
                onClick={() => console.log("clicked")}
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
                  <h4 className="text-sm font-semibold">정선원 간사</h4>
                  <p className="text-sm">CCC 부산지구 대표간사</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </p>
      </div>
    </div>
  );
}
