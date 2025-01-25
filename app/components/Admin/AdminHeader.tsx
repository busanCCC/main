"use client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "@/app/components/ui/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import menu, { ChevronRight } from "lucide-react";
import MenuDrawer from "@/app/components/MenuDrawer";
import { AdminDropdown } from "./AdminDropdown";
import { AdminAvatar } from "./AdminAvatar";

export default function AdminHeader() {
  const pathname = usePathname();
  const isActive = (path: string): boolean => pathname === path;
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center px-4 py-4">
        <NavigationMenu className="w-auto flex justify-start">
          <span className="max-sm:hidden font-bold text-lg">title</span>
          <ChevronRight className="max-sm:hidden text-gray-400" />
          <AdminDropdown />
        </NavigationMenu>
        <NavigationMenu>
          <AdminAvatar />
        </NavigationMenu>
      </div>
    </div>
  );
}
