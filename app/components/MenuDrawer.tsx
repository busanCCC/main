"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from "@/app/components/ui/drawer";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { DialogTitle } from "./ui/dialog";

export default function MenuDrawer() {
  return (
    <Drawer>
      <DrawerTrigger className="p-2">
        <Menu className="w-6 h-6 text-gray-800" />
      </DrawerTrigger>
      <DrawerContent className="px-4 py-4 gap-3 font-light">
        <DialogTitle />
        <Link href="/home" legacyBehavior passHref>
          홈
        </Link>
        <Link href="/eventlist" legacyBehavior passHref>
          이벤트
        </Link>
        <Link href="/comming" legacyBehavior passHref>
          오시는 길
        </Link>
        {/* <DrawerFooter>
          <DrawerClose>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}
