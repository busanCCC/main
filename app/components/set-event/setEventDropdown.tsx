import { Button } from "../ui/button";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { supabase } from "@/api/supabase";

interface SetEventDropdownProps {
  id: number;
  onDelete: (id: number) => void; // 부모 컴포넌트에서 삭제 요청을 위한 콜백 함수
}

export default function SetEventDropdown({
  id,
  onDelete,
}: SetEventDropdownProps) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      // Supabase에서 해당 id의 데이터를 삭제
      const { error } = await supabase
        .from("posts") // 'events' 테이블에서
        .delete()
        .eq("id", id); // id가 일치하는 데이터를 삭제
      if (error) {
        throw error;
      }

      // 삭제 성공 시 부모에게 상태 업데이트 요청
      alert("삭제되었습니다.");
      onDelete(id);
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="gap-3"
            onClick={() => router.push(`/admin-page/set-event/${id}`)}
          >
            <Pencil />
            <span>수정하기</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-3"
            onClick={(e) => {
              e.stopPropagation(); // 페이지 이동을 막음
              handleDelete();
            }}
          >
            <Trash2 />
            <span>삭제하기</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
