'use client';

import React, { useState, useEffect } from 'react';
import { Preloader } from './components';

interface ClientWrapperProps {
  children: React.ReactNode;
}

const ClientWrapper: React.FC<ClientWrapperProps> = ({ children }) => {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (preloaderDone) {
      // Небольшая задержка перед показом контента для плавного перехода
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [preloaderDone]);

  return (
    <>
      <Preloader onComplete={() => setPreloaderDone(true)} />

      <div
        className={`transition-opacity duration-500 ${
          showContent ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {children}
      </div>
    </>
  );
};

export default ClientWrapper;
