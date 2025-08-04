
import React from 'react';
import { GuacamoleLogEntry } from '@/components/guacamole/GuacamoleLogs';

export const useGuacamoleLogs = () => {
  const [logs, setLogs] = React.useState<GuacamoleLogEntry[]>([]);

  const addLog = React.useCallback((
    type: GuacamoleLogEntry['type'],
    message: string,
    options?: {
      method?: string;
      url?: string;
      dataSource?: string;
      status?: number;
      details?: any;
    }
  ) => {
    const newLog: GuacamoleLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      ...options
    };

    setLogs(prev => [...prev, newLog]);
    console.log('Guacamole Log:', newLog);
  }, []);

  const clearLogs = React.useCallback(() => {
    setLogs([]);
  }, []);

  const logRequest = React.useCallback((method: string, url: string, dataSource?: string) => {
    addLog('request', `Fazendo requisição ${method}`, {
      method,
      url,
      dataSource
    });
  }, [addLog]);

  const logResponse = React.useCallback((status: number, message: string, url?: string, details?: any) => {
    addLog('response', message, {
      status,
      url,
      details
    });
  }, [addLog]);

  const logError = React.useCallback((message: string, url?: string, details?: any) => {
    addLog('error', message, {
      url,
      details
    });
  }, [addLog]);

  const logInfo = React.useCallback((message: string, details?: any) => {
    addLog('info', message, {
      details
    });
  }, [addLog]);

  return {
    logs,
    addLog,
    clearLogs,
    logRequest,
    logResponse,
    logError,
    logInfo
  };
};
