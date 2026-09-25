"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import MetallicPaint from "./MetallicPaint";

function createTstMask(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1800;
  canvas.height = 1800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.font = "900 980px 'Arial Black', Impact, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("TST", canvas.width / 2, 8);
  return canvas.toDataURL("image/png");
}

export default function TstTeaser() {
  const [maskSrc, setMaskSrc] = useState<string | null>(null);
  const [paintReady, setPaintReady] = useState(false);

  useEffect(() => {
    setMaskSrc(createTstMask());
  }, []);

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-x-0 top-0 z-40 flex h-[38%] flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
          animate={
            paintReady
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 12, filter: "blur(10px)" }
          }
          transition={{ duration: 1.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="pl-[0.85em] text-[11px] font-light tracking-[0.85em] text-white/80 sm:text-xs"
        >
          2027
        </motion.p>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={
            paintReady
              ? { scaleX: 1, opacity: 0.7 }
              : { scaleX: 0, opacity: 0 }
          }
          transition={{ duration: 1.2, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 h-px w-16 origin-center bg-white/80"
        />

        <motion.h1
          initial={{ opacity: 0, y: 18, filter: "blur(14px)" }}
          animate={
            paintReady
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 18, filter: "blur(14px)" }
          }
          transition={{ duration: 1.8, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 pl-[0.28em] text-3xl font-light tracking-[0.28em] text-white sm:text-5xl"
        >
          Coming Soon
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={paintReady ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1.6, delay: 1.1 }}
          className="mt-5 pl-[0.55em] text-[10px] font-light tracking-[0.55em] text-white/60"
        >
          TO BE REVEALED
        </motion.p>
      </div>

      <div className="absolute inset-x-0 top-[38%] z-10 h-[100dvh] w-full">
        {maskSrc ? (
          <MetallicPaint
            imageSrc={maskSrc}
            onReady={() => setPaintReady(true)}
            reveal
            revealDuration={9200}
            className="h-full w-full"
            scale={3.4}
            refraction={0.02}
            blur={0.01}
            liquid={0.72}
            speed={0.24}
            brightness={2.15}
            contrast={0.72}
            fresnel={1.2}
            lightColor="#ffffff"
            darkColor="#2a2a2a"
            tintColor="#ddd6c8"
            patternSharpness={0.9}
            waveAmplitude={1.05}
            noiseScale={0.45}
            chromaticSpread={1.6}
            distortion={0.85}
            contour={0.18}
          />
        ) : null}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.12) 16%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 84%, rgba(0,0,0,0.92) 100%)",
        }}
      />
    </main>
  );
}
