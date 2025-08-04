import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from 'lucide-react';

export const Layout = ({ children }) => {
  console.log('Layout emergency mode');
  
  return React.createElement('div', {
    className: 'min-h-screen bg-slate-900'
  }, [
    React.createElement('header', {
      key: 'header',
      className: 'bg-slate-800 border-b border-slate-700 p-4'
    }, [
      React.createElement('div', {
        key: 'header-content',
        className: 'flex items-center gap-3'
      }, [
        React.createElement(Shield, {
          key: 'logo',
          className: 'h-6 w-6 text-white'
        }),
        React.createElement('h1', {
          key: 'title',
          className: 'text-xl font-bold text-white'
        }, 'Sistema de Gestão - Modo Emergência')
      ])
    ]),
    React.createElement('main', {
      key: 'main',
      className: 'p-4'
    }, children)
  ]);
};