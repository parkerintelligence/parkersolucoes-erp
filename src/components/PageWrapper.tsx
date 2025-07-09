
import React from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  title,
  subtitle,
  icon,
  headerActions,
  className = ""
}) => {
  const { getResponsiveClasses } = useResponsiveLayout();
  const classes = getResponsiveClasses();

  return (
    <div className={`${classes.container} ${className} bg-slate-900 text-white min-h-screen`}>
      <div className={classes.header}>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {headerActions && (
          <div className="flex flex-wrap gap-2">
            {headerActions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
