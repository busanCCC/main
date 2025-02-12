import type { Metadata } from "next";

// 폰트 다음같이 사용하기
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "11/14 목요채플 순서",
  description: "부산지구 CCC 목요채플 순서입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="w-full h-full max-w-7xl">{children}</div>
    </div>
  );
}
