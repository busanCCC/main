import {
  ChevronDown,
  Cloud,
  CreditCard,
  Github,
  Keyboard,
  LifeBuoy,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  PlusCircle,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export function AdminDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          테스트 <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-36">
        <DropdownMenuLabel>My Archives</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            <span>테스트</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Plus />
            <span>새 그룹 만들기</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
