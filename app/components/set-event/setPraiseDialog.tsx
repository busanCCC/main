import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Praise from "../worship-order/Praise";
import { Button } from "../ui/button";
import { Link2, Plus, X } from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";

export default function SetPraiseDialog({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<Array<{ text: string; link?: string }>>([
    { text: "" },
  ]);
  // 새 input 추가
  const addInput = () => {
    setInputs([...inputs, { text: "" }]);
  };

  // 특정 input 삭제
  const removeInput = (index: number) => {
    if (inputs.length === 1) return; // 최소 1개는 유지
    setInputs(inputs.filter((_, i) => i !== index));
  };

  // 링크 입력칸 추가/삭제
  const toggleLinkInput = (index: number) => {
    setInputs((prev) =>
      prev.map((item, i) =>
        i === index
          ? item.link
            ? { text: item.text } // link 속성을 삭제
            : { ...item, link: item.link ? undefined : "" } // link 속성 추가
          : item
      )
    );
  };
  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer" onClick={() => setOpen(true)}>
            <Praise id={id} />
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>찬양 LIST</DialogTitle>
          </DialogHeader>
          <div>
            <div className="flex-row space-y-2">
              {inputs.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="border p-2 rounded-md w-full"
                    placeholder={`입력 ${index + 1}`}
                  />
                  <Button onClick={() => toggleLinkInput(index)}>
                    <Link2 />
                  </Button>
                  {inputs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInput(index)}
                    >
                      <X className="w-5 h-5 text-red-500" />
                    </Button>
                  )}
                  {/* 링크 입력란 (필요할 때만 표시) */}
                  {/* {inputs.link !== undefined && (
                    <input
                      type="text"
                      className="border p-2 rounded-md w-full"
                      placeholder="링크 입력"
                    />
                  )} */}
                </div>
              ))}
              <Button
                onClick={addInput}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 추가하기
              </Button>
            </div>
            <div className="flex justify-between pt-4">
              <DialogClose asChild>
                <Button variant="outline">취소</Button>
              </DialogClose>
              <Button>수정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
