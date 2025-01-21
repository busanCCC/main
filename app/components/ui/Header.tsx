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
import menu from "lucide-react";
import MenuDrawer from "@/app/components/MenuDrawer";

export default function Header() {
  const pathname = usePathname();
  const isActive = (path: string): boolean => pathname === path;
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center px-4 py-2">
        <NavigationMenu className="w-auto flex justify-start">
          <span className="font-bold text-lg">title</span>
        </NavigationMenu>
        <div className="lg:hidden">
          <NavigationMenu>
            <MenuDrawer />
          </NavigationMenu>
        </div>
      </div>
      <div className="flex justify-center items-center">
        <NavigationMenu>
          <NavigationMenuList className="hidden lg:flex space-x-4">
            <NavigationMenuItem>
              <Link href="/home" legacyBehavior passHref>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive("/home") ? "font-bold" : ""
                  }`}
                >
                  홈
                </NavigationMenuLink>
              </Link>
              <Link href="/eventlist" legacyBehavior passHref>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive("/eventlist") ? "font-bold" : ""
                  }`}
                >
                  이벤트
                </NavigationMenuLink>
              </Link>
              <Link href="/comming" legacyBehavior passHref>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive("/comming") ? "font-bold" : ""
                  }`}
                >
                  오시는 길
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
