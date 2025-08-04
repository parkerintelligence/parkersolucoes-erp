"use client"

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export const useClearAllCache = () => {
  const [isClearing, setIsClearing] = useState(false);
  const queryClient = useQueryClient();

  const clearServiceWorkerCache = async (): Promise<void> => {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('✅ Service Worker cache limpo');
          } else {
            console.error('❌ Erro ao limpar Service Worker cache');
          }
          resolve();
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_ALL_CACHES' },
          [messageChannel.port2]
        );
      } else {
        console.log('⚠️ Service Worker não disponível');
        resolve();
      }
    });
  };

  const clearReactQueryCache = () => {
    try {
      // Limpar todo o cache do React Query
      queryClient.clear();
      
      // Invalidar todas as queries
      queryClient.invalidateQueries();
      
      // Resetar estado de mutações
      queryClient.resetQueries();
      
      console.log('✅ React Query cache limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar React Query cache:', error);
    }
  };

  const clearBrowserStorage = () => {
    try {
      // Limpar localStorage
      localStorage.clear();
      console.log('✅ localStorage limpo');
      
      // Limpar sessionStorage
      sessionStorage.clear();
      console.log('✅ sessionStorage limpo');
      
      // Limpar cookies (apenas os do domínio atual)
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      console.log('✅ Cookies limpos');
      
    } catch (error) {
      console.error('❌ Erro ao limpar browser storage:', error);
    }
  };

  const clearAllCache = async () => {
    setIsClearing(true);
    
    try {
      console.log('🗑️ Iniciando limpeza completa de cache...');
      
      // Mostrar toast de início
      toast({
        title: "Limpando cache...",
        description: "Removendo todos os dados em cache do sistema.",
      });

      // 1. Limpar Service Worker cache
      await clearServiceWorkerCache();
      
      // 2. Limpar React Query cache
      clearReactQueryCache();
      
      // 3. Limpar Browser Storage
      clearBrowserStorage();
      
      // 4. Limpar cache do navegador (forçar reload)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ Browser caches limpos');
      }

      console.log('✅ Limpeza completa finalizada');
      
      // Toast de sucesso
      toast({
        title: "Cache limpo com sucesso!",
        description: "Todos os dados em cache foram removidos. A página será recarregada.",
      });

      // Aguardar um pouco para mostrar o toast e então recarregar
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro durante limpeza de cache:', error);
      toast({
        title: "Erro ao limpar cache",
        description: "Ocorreu um erro durante a limpeza. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const clearSelectiveCache = async (options: {
    serviceWorker?: boolean;
    reactQuery?: boolean;
    browserStorage?: boolean;
  }) => {
    setIsClearing(true);
    
    try {
      console.log('🗑️ Iniciando limpeza seletiva de cache...', options);
      
      if (options.serviceWorker) {
        await clearServiceWorkerCache();
      }
      
      if (options.reactQuery) {
        clearReactQueryCache();
      }
      
      if (options.browserStorage) {
        clearBrowserStorage();
      }
      
      toast({
        title: "Cache seletivo limpo!",
        description: "Os caches selecionados foram removidos.",
      });
      
    } catch (error) {
      console.error('❌ Erro durante limpeza seletiva:', error);
      toast({
        title: "Erro ao limpar cache",
        description: "Ocorreu um erro durante a limpeza seletiva.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getCacheStatus = async () => {
    const status = {
      serviceWorker: 'serviceWorker' in navigator && navigator.serviceWorker.controller ? 'Ativo' : 'Inativo',
      reactQuery: queryClient.getQueryCache().getAll().length,
      localStorage: localStorage.length,
      sessionStorage: sessionStorage.length,
    };
    
    console.log('📊 Status do cache:', status);
    return status;
  };

  return {
    clearAllCache,
    clearSelectiveCache,
    getCacheStatus,
    isClearing
  };
};