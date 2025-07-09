
import { useState, useEffect } from 'react';

export const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getGridCols = (base: number = 1, md: number = 2, lg: number = 3) => {
    if (isMobile) return base;
    if (isTablet) return md;
    return lg;
  };

  const getResponsiveClasses = () => ({
    container: "space-y-6 p-4 md:p-6",
    header: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
    grid: "grid gap-4 md:gap-6",
    card: "w-full",
    button: "w-full sm:w-auto",
    table: "overflow-x-auto",
  });

  return {
    isMobile,
    isTablet,
    getGridCols,
    getResponsiveClasses,
  };
};
