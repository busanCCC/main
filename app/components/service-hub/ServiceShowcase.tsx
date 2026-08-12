"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import type { Service, ServiceFeature } from "./services";

type ServiceShowcaseProps = {
  service: Service;
};

const MAX_TILT = 5;

function FeatureItem({
  feature,
  accent,
}: {
  feature: ServiceFeature;
  accent: string;
}) {
  const { icon: FeatureIcon, text, tag, subtext } = feature;

  return (
    <li className="group relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white/80 to-white/40 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-md">
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20",
          accent
        )}
      />
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 ring-white/60",
            accent
          )}
        >
          <FeatureIcon className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-medium leading-snug text-gray-800">
              {text}
            </span>
            {tag === "beta" && (
              <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-700 shadow-sm">
                BETA
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs leading-relaxed text-gray-500">{subtext}</p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ServiceShowcase({ service }: ServiceShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const themeColorRef = useRef(service.themeColor ?? "#6366f1");

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useTransform(mouseY, [0, 1], [MAX_TILT, -MAX_TILT]);
  const rotateY = useTransform(mouseX, [0, 1], [-MAX_TILT, MAX_TILT]);

  const {
    name,
    tagline,
    badge,
    description,
    features,
    accent,
    accentStrong,
    image,
    icon: Icon,
    themeColor = "#6366f1",
    primaryLink,
    storeLinks,
    pendingLabel,
  } = service;

  themeColorRef.current = themeColor;
  const availableStoreLinks = storeLinks?.filter((link) => link.href) ?? [];

  const resetInteraction = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    isHoveringRef.current = false;

    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "0";
    }
    if (tiltRef.current) {
      tiltRef.current.style.transform =
        "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    }
  }, [mouseX, mouseY]);

  useEffect(() => {
    resetInteraction();

    const content = contentRef.current;
    if (!content) return;

    content.style.transition = "none";
    content.style.opacity = "0";
    content.style.transform = "translateY(6px)";

    const raf = requestAnimationFrame(() => {
      content.style.transition = "opacity 0.22s ease, transform 0.22s ease";
      content.style.opacity = "1";
      content.style.transform = "translateY(0)";
    });

    return () => cancelAnimationFrame(raf);
  }, [service.id, resetInteraction]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!prefersFinePointer || prefersReducedMotion) return;

    let pendingX = 0.5;
    let pendingY = 0.5;
    let spotlightX = 0;
    let spotlightY = 0;

    const applyFrame = () => {
      rafRef.current = null;

      mouseX.set(pendingX);
      mouseY.set(pendingY);

      const rotX = (0.5 - pendingY) * MAX_TILT * 2;
      const rotY = (pendingX - 0.5) * MAX_TILT * 2;

      if (tiltRef.current) {
        tiltRef.current.style.transform = `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      }

      if (spotlightRef.current && isHoveringRef.current) {
        spotlightRef.current.style.background = `radial-gradient(420px circle at ${spotlightX}px ${spotlightY}px, ${themeColorRef.current}28, transparent 55%)`;
        spotlightRef.current.style.opacity = "1";
      }
    };

    const scheduleFrame = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(applyFrame);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      pendingX = (event.clientX - rect.left) / rect.width;
      pendingY = (event.clientY - rect.top) / rect.height;
      spotlightX = event.clientX - rect.left;
      spotlightY = event.clientY - rect.top;
      isHoveringRef.current = true;
      scheduleFrame();
    };

    const onPointerLeave = () => {
      resetInteraction();
    };

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);

    return () => {
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [mouseX, mouseY, resetInteraction]);

  return (
    <div
      ref={containerRef}
      className="service-showcase-card relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.18)]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="service-dot-grid absolute inset-0 opacity-[0.35]" />

        <div
          className={cn(
            "absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gradient-to-br opacity-25 blur-3xl transition-all duration-700",
            accent
          )}
        />
        <div
          className={cn(
            "absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-gradient-to-tr opacity-20 blur-3xl transition-all duration-700",
            accent
          )}
        />

        <div
          className="absolute inset-0 opacity-50 transition-all duration-700"
          style={{
            backgroundImage: `radial-gradient(circle at 15% 25%, ${themeColor}28 0%, transparent 42%), radial-gradient(circle at 85% 75%, ${themeColor}18 0%, transparent 38%)`,
          }}
        />

        <div
          ref={spotlightRef}
          className="absolute inset-0 opacity-0 will-change-[opacity]"
          style={{ transition: "opacity 0.25s ease" }}
        />
      </div>

      <div
        ref={tiltRef}
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{
          transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)",
          transition: "transform 0.15s ease-out",
        }}
      >
        <div
          className={cn(
            "absolute inset-[10px] rounded-[1.25rem] border border-white/50 bg-gradient-to-br opacity-30 transition-all duration-700",
            accent
          )}
        />
      </div>

      <div
        className={cn(
          "relative h-[3px] w-full bg-gradient-to-r transition-all duration-700",
          accent
        )}
      />

      <div
        ref={contentRef}
        className="relative grid gap-8 p-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] md:p-8 lg:p-10"
      >
        <div className="flex flex-col items-center justify-center gap-6 md:items-start">
          <div className="relative">
            <div
              className="absolute -inset-8 rounded-full blur-3xl opacity-70 transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${themeColor}40, transparent 68%)`,
              }}
            />
            <div
              className={cn(
                "absolute -inset-3 rounded-[2rem] bg-gradient-to-br opacity-20 blur-md transition-all duration-700",
                accent
              )}
            />
            <motion.div
              style={{ rotateX, rotateY, transformPerspective: 900 }}
              className="relative will-change-transform"
            >
              <div className="rounded-[1.75rem] bg-gradient-to-br from-white to-white/60 p-1.5 shadow-xl ring-1 ring-white/90">
                {image ? (
                  <Image
                    src={image}
                    alt={`${name} 대표 이미지`}
                    width={160}
                    height={160}
                    className="h-28 w-28 rounded-[1.4rem] object-cover md:h-36 md:w-36"
                  />
                ) : (
                  Icon && (
                    <div
                      className={cn(
                        "flex h-28 w-28 items-center justify-center rounded-[1.4rem] bg-gradient-to-br md:h-36 md:w-36",
                        accent
                      )}
                    >
                      <Icon className="h-14 w-14 text-white" strokeWidth={1.75} />
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
            <span
              className={cn(
                "inline-flex items-center rounded-full border border-white/90 bg-white/80 px-3 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm",
                "text-gray-600"
              )}
            >
              {badge}
            </span>
            <div className="space-y-1.5">
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 md:text-[1.75rem]">
                {name}
              </h3>
              <p
                className={cn(
                  "bg-gradient-to-r bg-clip-text text-base font-semibold text-transparent md:text-lg",
                  accentStrong
                )}
              >
                {tagline}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <p className="rounded-2xl border border-white/60 bg-white/50 px-4 py-3.5 text-sm leading-relaxed text-gray-600 shadow-sm md:text-[15px]">
            {description}
          </p>

          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <FeatureItem
                key={feature.text}
                feature={feature}
                accent={accent}
              />
            ))}
          </ul>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {primaryLink && (
              <Button
                asChild
                className={cn(
                  "h-10 rounded-full bg-gradient-to-r px-5 text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg hover:opacity-95",
                  accentStrong
                )}
              >
                <a
                  href={primaryLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {primaryLink.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            )}

            {availableStoreLinks.map((link) => (
              <Button
                key={link.label}
                asChild
                variant="outline"
                className="h-10 rounded-full border-gray-200/80 bg-white/80 px-5 shadow-sm transition-all hover:scale-[1.02] hover:border-gray-300 hover:bg-white hover:shadow-md"
              >
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                </a>
              </Button>
            ))}

            {storeLinks && availableStoreLinks.length === 0 && pendingLabel && (
              <span className="inline-flex h-10 items-center rounded-full bg-white/70 px-5 text-sm font-medium text-gray-500 ring-1 ring-gray-200/60">
                {pendingLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
