"use client";

import FooterSection from "@/app/components/FooterSection";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center">
        <p>Sorry, somethinf went wrong</p>
      </div>
      <FooterSection />
    </div>
  );
}
