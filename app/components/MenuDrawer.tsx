"use client";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/app/components/ui/drawer";
import { Menu, UserX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DialogTitle } from "./ui/dialog";
import Image from "next/image";
import { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";

export default function MenuDrawer() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <Drawer>
      <DrawerTrigger className="p-2">
        <Menu className="w-6 h-6 text-gray-800" />
      </DrawerTrigger>
      <DrawerContent className="px-4 py-4 gap-3 font-light">
        <DialogTitle />
        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded w-full text-left"
          >
            로그아웃
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
          >
            로그인
          </Link>
        )}
        {isLoggedIn && (
          <Link
            href="/account/delete"
            className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded text-destructive"
          >
            <UserX className="w-5 h-5" />
            계정 삭제 / 탈퇴
          </Link>
        )}
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
