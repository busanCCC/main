"use client";

import EventForm from "@/app/components/EventForm";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";

export default function AddEventPage() {
  const router = useRouter();
  return (
    <div className="h-full flex-col m-4 space-y-10">
      <h1 className="cursor-pointer" onClick={() => router.back()}>
        취소
      </h1>
      <div className="pt-10 pb-20 text-2xl">
        추가할 이벤트의 이름을 입력해주세요.
      </div>
      <div>
        <EventForm />
      </div>
    </div>
  );
}
