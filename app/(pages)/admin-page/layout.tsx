import type { Metadata } from "next";

// 폰트 다음같이 사용하기
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "부산지구 CCC 온라인 주보",
  description: "부산지구 CCC 온라인 주보",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="w-full h-full">{children}</div>;
}
