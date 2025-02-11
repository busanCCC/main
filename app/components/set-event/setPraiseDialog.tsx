import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import Praise from "../worship-order/Praise";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Link2, Plus, X } from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";

export default function SetPraiseDialog({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<string[]>([""]);

  // 새 input 추가
  const addInput = () => {
    setInputs([...inputs, ""]);
  };

  // 특정 input 삭제
  const removeInput = (index: number) => {
    if (inputs.length === 1) return; // 최소 1개는 유지
    setInputs(inputs.filter((_, i) => i !== index));
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
                    value={value}
                    className="border p-2 rounded-md w-full"
                    placeholder={`입력 ${index + 1}`}
                  />
                  <Button>
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
