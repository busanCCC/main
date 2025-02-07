import { supabase } from "@/api/supabase";

export async function getPosts() {
  const { data, error } = await supabase.from("posts").select("*");

  if (error) {
    console.error("데이터 패칭 실패", error);
    return [];
  }
  console.log("데이터 패칭 성공", data);
  return data;
}
