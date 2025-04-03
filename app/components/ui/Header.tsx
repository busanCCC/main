"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/app/components/ui/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MenuDrawer from "@/app/components/MenuDrawer";
import { Button } from "./button";

export default function Header() {
  const pathname = usePathname();
  const isActive = (path: string): boolean => pathname === path;
  return (
    <div className="w-full flex items-center min-h-16">
      <div className="w-full flex justify-between items-center px-4 py-2">
        <NavigationMenu className="w-auto flex justify-start">
          <Link href="/">
            <Button className="font-bold text-lg" variant="ghost">
              부산지구 CCC
            </Button>
          </Link>
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
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive("/") ? "font-bold" : ""
                  }`}
                >
                  홈
                </NavigationMenuLink>
              </Link>
              {/* <Link href="/eventlist" legacyBehavior passHref>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive("/eventlist") ? "font-bold" : ""
                  }`}
                >
                  이벤트
                </NavigationMenuLink>
              </Link> */}
              {/* <Link href="/comming" legacyBehavior passHref>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive("/comming") ? "font-bold" : ""
                  }`}
                >
                  오시는 길
                </NavigationMenuLink>
              </Link> */}
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
