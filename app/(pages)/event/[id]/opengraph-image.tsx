import { supabase } from "@/api/supabase";
import { ImageResponse } from "next/og";

export const alt = "About Acme";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const runtime = "edge";

type Props = {
  params: {
    id: string;
  };
};

export default async function og({ params: { id } }: Props) {
  try {
    const numericId = parseInt(id, 10);
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", numericId)
      .single();

    if (postError) {
      console.error("Supabase Fetch Error:", postError);
      throw new Error("Failed to fetch post data");
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="https://busanccc-swart.vercel.app/tst.png"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              width: "100%",
              objectFit: "cover",
            }}
            alt="주보 미리보기 배경사진"
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: "14px",
              bottom: 0,
              left: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                padding: "14px 32px",
                fontSize: 92,
                fontWeight: 500,
                color: "white",
                textAlign: "center",
                backgroundColor: "rgba(0 0 0, 0.3)",
              }}
            >
              {postData?.subtitle || "부산지구 ccc 온라인 주보"}
            </p>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error("OG Image Generation Error:", error);
  }
}
