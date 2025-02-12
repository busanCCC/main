"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/app/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/api/supabase";
import { Label } from "./ui/label";

const formSchema = z.object({
  title: z.string().min(2, { message: "이벤트 명은 2글자 이상이어야 합니다." }),
  subTitle: z.string().optional(), // 🔹 subTitle 추가 (선택 입력)
});

export default function EventForm() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subTitle: "",
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { title, subTitle } = values;
    if (!date || !time) {
      alert("날짜와 시간을 모두 입력해주세요.");
      return;
    }
    const schedule = new Date(`${date}T${time}:00`).toISOString();

    try {
      const { data, error } = await supabase.from("posts").insert([
        {
          title,
          subTitle,
          schedule, // 날짜/시간 ISO 형식
        },
      ]);

      if (error) {
        throw error;
      }

      console.log("이벤트 추가 성공:", data);
      router.push("/admin-page");
    } catch (error) {
      console.error("이벤트 추가 실패:", error);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 flex-col"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제목</FormLabel>
              <FormControl>
                <Input
                  placeholder="OO월OO일 목요채플, 수련회 개회예배 등.."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>부제목</FormLabel>
              <FormControl>
                <Input placeholder="OO섬김 채플, 기도회 등.." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="py-2">
          <Label htmlFor="Date">날짜</Label>
          <Input
            className="justify-center"
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="py-2 pb-4">
          <Label htmlFor="Time">시간</Label>
          <Input
            className="justify-center"
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">이벤트 저장</Button>
        </div>
      </form>
    </Form>
  );
}
