"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import ServiceShowcase from "./ServiceShowcase";
import { services } from "./services";

const AUTO_ADVANCE_MS = 9000;

export default function ServiceHubSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const activeService = services[activeIndex];

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    setProgressKey((key) => key + 1);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % services.length);
    setProgressKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (isPaused || services.length <= 1) return;

    const timer = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, activeIndex]);

  return (
    <section
      className="relative w-full flex flex-col gap-9"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-gradient-to-r from-white to-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          부산지구 CCC 서비스
        </span>
        <h2 className="max-w-lg text-2xl font-bold leading-snug tracking-tight md:text-3xl">
          <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-800 bg-clip-text text-transparent">
            부산지구에서 진행중인 사역을
          </span>
          <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {" "}
            한 곳에서 만나보세요
          </span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-gray-500">
          캠퍼스 복음화를 위해 부산지구가 직접 만들고 운영하는 서비스입니다.
          탭을 눌러 자세히 살펴보세요.
        </p>
      </motion.div>

      <div className="flex flex-col items-center gap-5">
        <div className="relative flex w-full max-w-lg rounded-2xl border border-white/80 bg-white/70 p-1.5 shadow-lg shadow-blue-500/5 ring-1 ring-white/60">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc(50%-6px)] rounded-xl bg-gradient-to-r shadow-md transition-transform duration-300 ease-out",
              activeService.accent
            )}
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />

          {services.map((service, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => goTo(index)}
                aria-pressed={isActive}
                className={cn(
                  "relative z-10 flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:bg-white/40 hover:text-gray-700"
                )}
              >
                <span className="flex items-center gap-2.5">
                  {service.image && (
                    <span
                      className={cn(
                        "overflow-hidden rounded-lg ring-2 transition-all",
                        isActive
                          ? "ring-white/40 shadow-sm"
                          : "ring-white/80"
                      )}
                    >
                      <Image
                        src={service.image}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 object-cover"
                      />
                    </span>
                  )}
                  <span className="hidden sm:inline">{service.name}</span>
                  <span className="sm:hidden">
                    {service.id === "siat-sunjang" ? "씨앗순장" : "커뮤니티"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          {services.map((service, index) => (
            <button
              key={service.id}
              type="button"
              aria-label={`${service.name} 보기`}
              onClick={() => goTo(index)}
              className={cn(
                "group relative h-1 overflow-hidden rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-12 bg-gray-200/90"
                  : "w-2 bg-gray-300/70 hover:w-3 hover:bg-gray-300"
              )}
            >
              {index === activeIndex && !isPaused && (
                <span
                  key={progressKey}
                  className={cn(
                    "service-progress-fill absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                    service.accent
                  )}
                  style={{ animationDuration: `${AUTO_ADVANCE_MS}ms` }}
                />
              )}
              {index === activeIndex && isPaused && (
                <span
                  className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-r",
                    service.accent
                  )}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse at center, ${activeService.themeColor ?? "#6366f1"}22, transparent 70%)`,
          }}
        />
        <ServiceShowcase service={activeService} />
      </div>
    </section>
  );
}
