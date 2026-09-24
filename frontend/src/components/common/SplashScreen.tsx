import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

interface SplashScreenProps {
  minDuration?: number; // milliseconds
}

export function SplashScreen({ minDuration = 2000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="medbridge-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070D1E] select-none pointer-events-auto overflow-hidden text-white"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15)_0%,rgba(7,13,30,0.95)_70%)] pointer-events-none" />
          
          {/* Ambient Pulsing Glow behind Logo */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.65, 0.35],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"
          />

          <motion.div
            animate={{
              scale: [1.1, 0.9, 1.1],
              opacity: [0.2, 0.45, 0.2],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute h-64 w-64 rounded-full bg-blue-600/25 blur-3xl pointer-events-none"
          />

          <div className="relative z-10 flex flex-col items-center px-4">
            {/* Logo Squircle Badge */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              {/* Outer Glowing Ring */}
              <div className="absolute -inset-2.5 rounded-[28px] bg-gradient-to-tr from-emerald-500/30 via-blue-500/20 to-indigo-500/30 blur-md" />
              
              <div className="relative flex size-24 sm:size-28 items-center justify-center rounded-[24px] border border-white/15 bg-gradient-to-b from-[#111C38] to-[#0B132B] shadow-2xl backdrop-blur-xl">
                {/* Logo Activity Icon with Gradient */}
                <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white shadow-lg">
                  <Activity className="size-8 sm:size-9 text-white animate-pulse" />
                </div>

                {/* Status indicator dot */}
                <span className="absolute -top-1 -right-1 flex size-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-4 rounded-full border-2 border-[#070D1E] bg-emerald-500" />
                </span>
              </div>
            </motion.div>

            {/* App Name with Letter Spacing */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
              className="mt-8 text-center"
            >
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-[0.3em] text-white drop-shadow-lg">
                {APP_NAME}
              </h1>
              <p className="mt-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-blue-300/80">
                Surplus Medicine Coordination
              </p>
            </motion.div>

            {/* Bottom Progress Loading Bar */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 160, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
              className="mt-8 h-1 overflow-hidden rounded-full bg-white/10"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{
                  duration: 1.85,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-indigo-400"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
