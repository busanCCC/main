"use client";
import { NavigationMenu } from "@/app/components/ui/navigation";
import { ChevronRight } from "lucide-react";
import { AdminDropdown } from "./AdminDropdown";
import { AdminAvatar } from "./AdminAvatar";

export default function AdminHeader() {
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
