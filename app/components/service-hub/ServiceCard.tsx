"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import type { Service } from "./services";

type ServiceCardProps = {
  service: Service;
  /** 카드가 순서대로 나타나도록 하는 지연 시간 */
  delay?: number;
};

export default function ServiceCard({ service, delay = 0 }: ServiceCardProps) {
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
    primaryLink,
    storeLinks,
    pendingLabel,
  } = service;

  const availableStoreLinks = storeLinks?.filter((link) => link.href) ?? [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md transition-shadow hover:shadow-xl"
    >
      <div className={cn("h-1.5 w-full bg-gradient-to-r", accent)} />

      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          {image ? (
            <Image
              src={image}
              alt={`${name} 대표 이미지`}
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-sm transition-transform group-hover:scale-105"
            />
          ) : (
            Icon && (
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm transition-transform group-hover:scale-105",
                  accent
                )}
              >
                <Icon className="h-8 w-8 text-white" strokeWidth={1.75} />
              </div>
            )
          )}

          <div className="flex flex-col gap-1.5">
            <span className="w-fit rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
              {badge}
            </span>
            <h3 className="text-lg font-bold text-gray-900 md:text-xl">
              {name}
            </h3>
            <p
              className={cn(
                "bg-gradient-to-r bg-clip-text text-sm font-semibold text-transparent",
                accentStrong
              )}
            >
              {tagline}
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-gray-600">{description}</p>

        <ul className="flex flex-col gap-2.5">
          {features.map(({ icon: FeatureIcon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <FeatureIcon
                className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                strokeWidth={2}
              />
              <span className="text-sm text-gray-700">{text}</span>
            </li>
          ))}
        </ul>

        {/* 카드 높이가 달라도 CTA는 항상 바닥에 정렬 */}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {primaryLink && (
            <Button
              asChild
              className={cn(
                "bg-gradient-to-r text-white shadow-sm transition-transform hover:scale-[1.02] hover:opacity-95",
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

          {/* 두 스토어는 동등한 진입점이므로 같은 강조로 렌더 */}
          {availableStoreLinks.map((link) => (
            <Button
              key={link.label}
              asChild
              className={cn(
                "bg-gradient-to-r text-white shadow-sm transition-transform hover:scale-[1.02] hover:opacity-95",
                accentStrong
              )}
            >
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ))}

          {storeLinks && availableStoreLinks.length === 0 && pendingLabel && (
            <span className="inline-flex h-9 items-center rounded-md bg-gray-100 px-4 text-sm font-medium text-gray-500">
              {pendingLabel}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
