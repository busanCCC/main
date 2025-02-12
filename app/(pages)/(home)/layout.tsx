import type { Metadata } from "next";

// 폰트 다음같이 사용하기
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "부산지구 CCC 온라인 주보",
  description:
    "부산지구 CCC 온라인 주보 사이트. 채플 정보와 부산지구의 다양한 소식을 함께 나눠요.",
  openGraph: {
    title: "부산지구 CCC 온라인 주보",
    description:
      "부산지구 CCC 온라인 주보 사이트. 채플 정보와 부산지구의 다양한 소식을 함께 나눠요.",
    url: "https://busanccc-swart.vercel.app",
    siteName: "CCC 부산지구",
    images: [
      {
        url: "https://busanccc-swart.vercel.app/busanccc.png",
        width: 400,
        height: 400,
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
      <div className="w-full h-full max-w-7xl">{children}</div>
    </div>
  );
}
