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

const formSchema = z.object({
  title: z.string().min(2, { message: "이벤트 명은 2글자 이상이어야 합니다." }),
  subTitle: z.string().optional(), // 🔹 subTitle 추가 (선택 입력)
});

export default function EventForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      subTitle: "",
    },
  });
  function onSubmit(values: z.infer<typeof formSchema>) {
    router.push(
      `/admin-page/add-event/time?title=${encodeURIComponent(
        values.title
      )}&subTitle=${encodeURIComponent(values.subTitle || "")}`
    );
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
        <div className="flex justify-end">
          <Button type="submit">다음</Button>
        </div>
      </form>
    </Form>
  );
}
