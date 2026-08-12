import { Toaster } from "@/app/components/ui/sonner";
import type { Metadata } from "next";
import SessionProvider from "@/components/SessionProvider";

// 폰트 다음같이 사용하기
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "부산지구 CCC",
  description:
    "부산지구 CCC의 사역 플랫폼. AI 씨앗순장, CCC 커뮤니티 앱을 비롯한 서비스와 채플·기도제목 소식을 한 곳에서 만나보세요.",
  openGraph: {
    title: "부산지구 CCC",
    description:
      "부산지구 CCC의 사역 플랫폼. AI 씨앗순장, CCC 커뮤니티 앱을 비롯한 서비스와 채플·기도제목 소식을 한 곳에서 만나보세요.",
    url: "https://busanccc-swart.vercel.app",
    siteName: "CCC 부산지구",
    images: [
      {
        url: "https://busanccc-swart.vercel.app/busanccc.png",
        width: 300,
        height: 300,
        alt: "CCC 부산지구 이미지",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <SessionProvider>
        <div className="w-full h-full max-w-7xl">{children}</div>
      </SessionProvider>
      <Toaster />
    </div>
  );
}
