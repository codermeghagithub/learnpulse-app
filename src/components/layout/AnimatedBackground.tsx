"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export function AnimatedBackground() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out mouse tracking for organic, fluid parallax movement
  const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Multi-layered subtle parallax offsets
  const orb1X = useTransform(smoothX, [-500, 500], [-35, 35]);
  const orb1Y = useTransform(smoothY, [-500, 500], [-35, 35]);

  const orb2X = useTransform(smoothX, [-500, 500], [45, -45]);
  const orb2Y = useTransform(smoothY, [-500, 500], [40, -40]);

  const orb3X = useTransform(smoothX, [-500, 500], [-25, 25]);
  const orb3Y = useTransform(smoothY, [-500, 500], [30, -30]);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      // Calculate position relative to viewport center
      const { innerWidth, innerHeight } = window;
      const x = e.clientX - innerWidth / 2;
      const y = e.clientY - innerHeight / 2;
      mouseX.set(x);
      mouseY.set(y);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* Dynamic Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-[0.025] dark:opacity-[0.035]" />

      {/* Floating Orb 1 - Top Left/Center Primary Violet/Indigo */}
      <motion.div
        style={{ x: orb1X, y: orb1Y }}
        animate={{
          scale: [1, 1.15, 0.95, 1],
          opacity: [0.12, 0.18, 0.14, 0.12],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-32 left-1/4 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-[110px] dark:from-primary/25 dark:via-primary/10"
      />

      {/* Floating Orb 2 - Right Mid Cyan/Sky Glow */}
      <motion.div
        style={{ x: orb2X, y: orb2Y }}
        animate={{
          scale: [1, 1.22, 0.92, 1],
          opacity: [0.08, 0.14, 0.1, 0.08],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-gradient-to-bl from-sky-500/25 via-indigo-500/15 to-transparent blur-[120px] dark:from-sky-500/20 dark:via-indigo-500/10"
      />

      {/* Floating Orb 3 - Bottom Left Emerald/Teal Adaptive Learning Glow */}
      <motion.div
        style={{ x: orb3X, y: orb3Y }}
        animate={{
          scale: [0.95, 1.18, 1, 0.95],
          opacity: [0.06, 0.12, 0.08, 0.06],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute -bottom-24 left-1/6 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-emerald-500/20 via-primary/10 to-transparent blur-[100px] dark:from-emerald-500/15 dark:via-primary/10"
      />

      {/* Ambient center spotlight highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[35rem] w-[50rem] bg-gradient-to-b from-primary/5 via-transparent to-transparent blur-[130px]" />
    </div>
  );
}
