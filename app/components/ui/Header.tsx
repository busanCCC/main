"use client";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/app/components/ui/navigation";
import Link from "next/link";
import Image from "next/image";
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
          <NavigationMenuList className="hidden lg:flex space-x-2">
            <NavigationMenuItem>
              <Link
                href="https://www.youtube.com/channel/UCLjWO6QuypERBL5FDtnUNGQ"
                legacyBehavior
                passHref
              >
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    isActive("/") ? "font-bold" : ""
                  }`}
                >
                  <Button variant="ghost" size="icon">
                    <Image
                      src="/Youtube.png"
                      alt="Youtube"
                      width={28}
                      height={28}
                    />
                  </Button>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="https://www.instagram.com/busan_ccc/"
                legacyBehavior
                passHref
              >
                <NavigationMenuLink>
                  <Button variant="ghost" size="icon" className="p-2">
                    <Image
                      src="/Instagram.png"
                      alt="Instagram"
                      width={24}
                      height={24}
                    />
                  </Button>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
}
