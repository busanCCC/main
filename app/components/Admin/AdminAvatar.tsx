import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";

export function AdminAvatar() {
  return (
    <Avatar className="ring-2 ring-offset-2 size-8">
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  );
}
