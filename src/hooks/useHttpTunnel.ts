import React, { useState, useEffect, useCallback } from 'react';

interface TunnelConfig {
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  enableCache?: boolean;
  fallbackStrategies?: ('websocket' | 'direct' | 'proxy' | 'edge-function')[];
}

interface TunnelResponse<T = any> {
  data: T | null;
  error: string | null;
  loading: boolean;
  success: boolean;
  strategy: string | null;
  attempts: number;
}

const DEFAULT_CONFIG: TunnelConfig = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 15000,
  enableCache: true,
  fallbackStrategies: ['direct', 'proxy', 'edge-function']
};

export const useHttpTunnel = (config: TunnelConfig = {}) => {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/http-tunnel-worker.js')
        .then((registration) => {
          console.log('[HTTP Tunnel] Service Worker registrado:', registration);
          setIsWorkerReady(true);
        })
        .catch((error) => {
          console.error('[HTTP Tunnel] Falha ao registrar Service Worker:', error);
          setIsWorkerReady(false);
        });
    }
  }, []);

  const makeRequest = useCallback(async <T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<TunnelResponse<T>> => {
    console.log('[HTTP Tunnel Hook] Iniciando request:', url);
    
    const response: TunnelResponse<T> = {
      data: null,
      error: null,
      loading: true,
      success: false,
      strategy: null,
      attempts: 0
    };

    try {
      // Adicionar parâmetro tunnel para interceptação
      const tunnelUrl = new URL(url, window.location.origin);
      tunnelUrl.searchParams.set('tunnel', 'true');
      
      const requestOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      console.log('[HTTP Tunnel Hook] Fazendo fetch:', tunnelUrl.toString());
      
      const fetchResponse = await fetch(tunnelUrl.toString(), requestOptions);
      
      if (!fetchResponse.ok) {
        throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }

      const data = await fetchResponse.json();
      
      return {
        ...response,
        data,
        loading: false,
        success: true,
        strategy: fetchResponse.headers.get('X-Tunnel-Strategy') || 'unknown',
        attempts: parseInt(fetchResponse.headers.get('X-Tunnel-Attempts') || '1')
      };

    } catch (error) {
      console.error('[HTTP Tunnel Hook] Erro na requisição:', error);
      
      return {
        ...response,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false,
        success: false
      };
    }
  }, [mergedConfig]);

  const get = useCallback(<T = any>(url: string, headers?: HeadersInit): Promise<TunnelResponse<T>> => {
    return makeRequest<T>(url, { method: 'GET', headers });
  }, [makeRequest]);

  const post = useCallback(<T = any>(url: string, body?: any, headers?: HeadersInit): Promise<TunnelResponse<T>> => {
    return makeRequest<T>(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  }, [makeRequest]);

  const put = useCallback(<T = any>(url: string, body?: any, headers?: HeadersInit): Promise<TunnelResponse<T>> => {
    return makeRequest<T>(url, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  }, [makeRequest]);

  const del = useCallback(<T = any>(url: string, headers?: HeadersInit): Promise<TunnelResponse<T>> => {
    return makeRequest<T>(url, { method: 'DELETE', headers });
  }, [makeRequest]);

  return {
    isWorkerReady,
    get,
    post,
    put,
    delete: del,
    makeRequest,
    config: mergedConfig
  };
};