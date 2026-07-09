import React from 'react';
import { motion } from 'framer-motion';

/**
 * Advanced Animations Collection
 * Reusable animation components for enhanced UI
 */

// Pulse animation variants
const pulseVariants = {
  initial: { opacity: 0.7, scale: 1 },
  animate: {
    opacity: [0.7, 1, 0.7],
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity }
  }
};

// Bounce animation
const bounceVariants = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 0.6, repeat: Infinity }
  }
};

// Glow effect
const glowVariants = {
  animate: {
    boxShadow: [
      '0 0 5px rgba(6, 182, 212, 0.3)',
      '0 0 20px rgba(6, 182, 212, 0.6)',
      '0 0 5px rgba(6, 182, 212, 0.3)'
    ],
    transition: { duration: 2, repeat: Infinity }
  }
};

// Slide in animation - handled inline in component

// Fade animation
const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 }
};

// Rotate animation
const rotateVariants = {
  animate: {
    rotate: 360,
    transition: { duration: 2, repeat: Infinity, repeatType: 'loop' as const }
  }
};

// Shimmer animation (from right to left)
const shimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 2, repeat: Infinity }
  }
};

// Float animation (smooth up/down) - handled inline in component

// Wave animation
const waveVariants = {
  animate: (delay: number) => ({
    y: [0, -10, 0],
    transition: { duration: 1.5, repeat: Infinity, delay }
  })
};

// Flip animation (3D)
const flipVariants = {
  animate: {
    rotateY: 360,
    transition: { duration: 1, repeat: Infinity }
  }
};

// Bounce in
const bounceInVariants = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: 'spring', stiffness: 300, damping: 10 }
};

export const AnimatedPulse: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div variants={pulseVariants} initial="initial" animate="animate">
    {children}
  </motion.div>
);

export const AnimatedBounce: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div variants={bounceVariants} animate="animate">
    {children}
  </motion.div>
);

export const AnimatedGlow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'cyan' }) => (
  <motion.div
    variants={glowVariants}
    animate="animate"
    className={`glow-${color}`}
  >
    {children}
  </motion.div>
);

export const AnimatedSlideIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export const AnimatedFade: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial="initial"
    animate="animate"
    variants={fadeVariants}
    transition={{ ...fadeVariants.transition, delay }}
  >
    {children}
  </motion.div>
);

export const AnimatedRotate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div variants={rotateVariants} animate="animate">
    {children}
  </motion.div>
);

export const AnimatedShimmer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    className="animate-shimmer"
    variants={shimmerVariants}
    animate="animate"
  >
    {children}
  </motion.div>
);

export const AnimatedFloat: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    animate={{ y: [-10, 10, -10] }}
    transition={{ duration: 3, repeat: Infinity }}
  >
    {children}
  </motion.div>
);

export const AnimatedWave: React.FC<{ children: React.ReactNode; index?: number }> = ({ children, index = 0 }) => (
  <motion.div custom={index * 0.1} variants={waveVariants} animate="animate">
    {children}
  </motion.div>
);

export const AnimatedFlip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div variants={flipVariants} animate="animate" style={{ perspective: 1000 }}>
    {children}
  </motion.div>
);

export const AnimatedBounceIn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div variants={bounceInVariants} initial="initial" animate="animate">
    {children}
  </motion.div>
);

// Complex animation: Loading dots
export const LoadingDots: React.FC = () => (
  <div className="flex gap-1 items-center">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-cyan-400"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

// Complex animation: Progress ring
export const ProgressRing: React.FC<{ progress: number; size?: number }> = ({ progress, size = 100 }) => {
  const radius = size / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ width: size, height: size }}>
      <motion.svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth="4"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </motion.svg>
    </div>
  );
};

// Complex animation: Staggered list
export const StaggeredContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    variants={{
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
      }
    }}
  >
    {children}
  </motion.div>
);

export const StaggeredItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={{
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
    }}
  >
    {children}
  </motion.div>
);

// Complex animation: 3D card flip
export const CardFlip3D: React.FC<{
  front: React.ReactNode;
  back: React.ReactNode;
}> = ({ front, back }) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <motion.div
      className="cursor-pointer h-full"
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      onClick={() => setIsFlipped(!isFlipped)}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d'
      }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{
          backfaceVisibility: 'hidden'
        }}
      >
        {front}
      </motion.div>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)'
        }}
      >
        {back}
      </motion.div>
    </motion.div>
  );
};

// Smooth counter animation
export const AnimatedCounter: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}> = ({ value, suffix = '', prefix = '', duration = 1 }) => {
  return (
    <motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {prefix}
      </motion.span>
      <motion.span>
        {value.toFixed(1)}
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {suffix}
      </motion.span>
    </motion.span>
  );
};

// Page transition animation
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);
