'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps {
  onComplete?: () => void;
}

const Preloader: FC<PreloaderProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки приложения
    const timer = setTimeout(() => {
      setLoading(false);
      if (onComplete) onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 bg-black"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.2 }}
              transition={{
                duration: 4,
                ease: 'easeOut',
                repeat: Infinity,
                repeatType: 'loop',
                repeatDelay: 0,
              }}
              className="mb-6 relative w-[600px] h-[600px]"
            >
              <Image
                src="/images/logo.png"
                alt="Логотип СФЕРА"
                fill
                className="object-contain"
                priority
              />
            </motion.div>

            <div className="text-center">
              <div className="text-white text-lg font-medium">Загрузка</div>

              <div className="flex justify-center gap-2 mt-3">
                <motion.div
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scaleY: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-1 h-4 bg-white rounded-full"
                />
                <motion.div
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scaleY: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.2,
                  }}
                  className="w-1 h-4 bg-white rounded-full"
                />
                <motion.div
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scaleY: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.4,
                  }}
                  className="w-1 h-4 bg-white rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
