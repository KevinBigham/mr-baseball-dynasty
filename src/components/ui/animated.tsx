/**
 * MBD Animation Primitives — built on Framer Motion.
 * Respects prefers-reduced-motion via Motion's useReducedMotion().
 */

import { type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

// ─── FadeIn ─────────────────────────────────────────────────────────────────

interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, duration = 0.2, delay = 0, className }: FadeInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── SlideUp ────────────────────────────────────────────────────────────────

interface SlideUpProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export function SlideUp({ children, duration = 0.25, delay = 0, className }: SlideUpProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── ScalePop ───────────────────────────────────────────────────────────────

interface ScalePopProps {
  children: ReactNode;
  className?: string;
}

export function ScalePop({ children, className }: ScalePopProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduce ? { duration: 0 } : {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerList ────────────────────────────────────────────────────────────

interface StaggerListProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerList({ children, staggerDelay = 0.03, className }: StaggerListProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? {} : {
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── PageTransition ─────────────────────────────────────────────────────────

interface PageTransitionProps {
  children: ReactNode;
  transitionKey: string;
  className?: string;
}

export function PageTransition({ children, transitionKey, className }: PageTransitionProps) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.15, ease: 'easeInOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Re-export for direct use
export { motion, AnimatePresence, useReducedMotion };
