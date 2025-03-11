import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { DialogClose, DialogTrigger } from "@radix-ui/react-dialog";
import { supabase } from "@/api/supabase";
import Message from "../worship-order/Message";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

type prop = {
  id: number;
  messenger: string;
  messagetitle: string;
  passage: string;
  words: string;
  messengerinfo: string;
  refreshEvent: () => void;
};

export default function SetMessageDialog({
  id,
  messenger,
  messagetitle,
  passage,
  words,
  messengerinfo,
  refreshEvent,
}: prop) {
  const [open, setOpen] = useState(false);
  const [inputMessenger, setMessenger] = useState(messenger);
  const [inputPassage, setPassage] = useState(passage);
  const [inputWords, setWords] = useState(words);
  const [inputMessagetitle, setMessagetitle] = useState(messagetitle);
  const [inputMessengerinfo, setMessengerinfo] = useState(messengerinfo);

  useEffect(() => {
    if (open) {
      setMessenger(messenger ?? "");
      setMessagetitle(messagetitle ?? "");
      setPassage(passage ?? "");
      setWords(words ?? "");
      setMessengerinfo(messengerinfo ?? "");
    }
  }, [open, messenger, passage, words, messengerinfo, messagetitle]);

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("posts")
      .update({
        messenger: inputMessenger,
        passage: inputPassage,
        words: inputWords,
        messengerinfo: inputMessengerinfo,
        messagetitle: inputMessagetitle,
      })
      .eq("id", id);

    if (error) {
      console.error("업데이트 실패:", error);
      alert("업데이트에 실패했습니다.");
    } else {
      alert("업데이트 성공!");
      refreshEvent();
      setOpen(false); // 다이얼로그 닫기
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="cursor-pointer" onClick={() => setOpen(true)}>
            <Message
              title={messagetitle}
              passage={passage}
              messenger={messenger}
              words={words}
              messengerInfo={messengerinfo}
              disableDrawer={true}
            />
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메세지 수정</DialogTitle>
          </DialogHeader>
          <div className="flex-col space-y-4">
            <div className="flex-col space-y-1">
              <Label>말씀 주제</Label>
              <Input
                id="messagetitle"
                type="text"
                onChange={(e) => setMessagetitle(e.target.value)}
                placeholder={messagetitle || "주제를 입력하세요"}
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>메신저</Label>
              <Input
                id="messenger"
                type="text"
                onChange={(e) => setMessenger(e.target.value)}
                placeholder={messenger || "메신저를 입력하세요"}
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>메신저 정보</Label>
              <Input
                id="messengerinfo"
                type="text"
                onChange={(e) => setMessengerinfo(e.target.value)}
                placeholder={messengerinfo || "메신저 정보를 입력하세요"}
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>말씀 구절</Label>
              <Input
                id="passage"
                type="text"
                onChange={(e) => setPassage(e.target.value)}
                placeholder={passage || "말씀 구절을 입력하세요"}
              />
            </div>
            <div className="flex-col space-y-1">
              <Label>말씀 본문</Label>
              <Input
                id="words"
                type="text"
                onChange={(e) => setWords(e.target.value)}
                placeholder={words || "말씀 본문을 입력하세요"}
              />
            </div>
            <div className="flex justify-between">
              <DialogClose asChild>
                <Button variant="outline">취소</Button>
              </DialogClose>
              <Button onClick={handleUpdate}>수정</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
