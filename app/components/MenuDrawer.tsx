"use client";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/app/components/ui/drawer";
import { Menu } from "lucide-react";
import Link from "next/link";
import { DialogTitle } from "./ui/dialog";
import Image from "next/image";

export default function MenuDrawer() {
  return (
    <Drawer>
      <DrawerTrigger className="p-2">
        <Menu className="w-6 h-6 text-gray-800" />
      </DrawerTrigger>
      <DrawerContent className="px-4 py-4 gap-3 font-light">
        <DialogTitle />
        <Link
          href="https://www.youtube.com/channel/UCLjWO6QuypERBL5FDtnUNGQ"
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
        >
          <Image
            src="/Youtube.png"
            alt="Youtube"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
          유튜브
        </Link>
        <Link
          href="https://www.instagram.com/busan_ccc/"
          className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
        >
          <Image
            src="/Instagram.png"
            alt="Instagram"
            width={24}
            height={24}
            className="w-6 h-6 p-1 object-contain"
          />
          인스타그램
        </Link>
      </DrawerContent>
    </Drawer>
  );
}
