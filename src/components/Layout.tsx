// Layout temporário simples
import React from 'react';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen p-4">
      {children}
    </div>
  );
};