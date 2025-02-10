"use client";
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
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";

export default function MenuDrawer() {
  return (
    <Drawer>
      <DrawerTrigger className="p-2">
        <Menu className="w-6 h-6 text-gray-800" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <Link href="/home" legacyBehavior passHref>
            <Button>홈</Button>
          </Link>
          <Link href="/eventlist" legacyBehavior passHref>
            <Button>이벤트</Button>
          </Link>
          <Link href="/comming" legacyBehavior passHref>
            <Button>오시는 길</Button>
          </Link>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
