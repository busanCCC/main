"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/app/components/ui/navigation";
import { Separator } from "@/app/components/ui/separator";

export function AdminNavigation() {
  return (
    <div className="w-full">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/admin-page" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                이벤트
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                출석
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                사용량
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                접근권한
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Separator />
    </div>
  );
}
