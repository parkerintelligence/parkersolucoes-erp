import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RealMetricsOptions {
  integrationId: string;
  vpsId: string;
  vpsIP?: string;
  enabled?: boolean;
}

// Hook para tentar obter métricas reais através de diferentes métodos
export const useHostingerRealMetrics = ({ integrationId, vpsId, vpsIP, enabled = true }: RealMetricsOptions) => {
  return useQuery({
    queryKey: ['hostinger-real-metrics', integrationId, vpsId],
    queryFn: async () => {
      console.log('🔍 Tentando obter métricas reais para VPS:', vpsId);

      // Método 1: Tentar através da API oficial do Hostinger
      const apiEndpoints = [
        `/virtual-machines/${vpsId}/usage`,
        `/virtual-machines/${vpsId}/monitoring`,
        `/virtual-machines/${vpsId}/stats`,
        `/virtual-machines/${vpsId}/metrics`,
        `/virtual-machines/${vpsId}/performance`,
        `/vps/${vpsId}/metrics`,
        `/servers/${vpsId}/stats`
      ];

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`🔍 Testando endpoint: ${endpoint}`);
          
          const { data, error } = await supabase.functions.invoke('hostinger-proxy', {
            body: {
              integration_id: integrationId,
              endpoint: endpoint,
              method: 'GET'
            }
          });

          if (!error && data?.success && data?.data) {
            const metricsData = data.data;
            
            // Verificar se os dados contêm métricas válidas
            if (hasValidMetrics(metricsData)) {
              console.log(`✅ Métricas reais encontradas via API:`, metricsData);
              
              return {
                ...normalizeMetrics(metricsData),
                source: 'hostinger_api',
                endpoint: endpoint,
                isReal: true,
                lastUpdated: new Date().toISOString()
              };
            }
          }
        } catch (e) {
          console.log(`❌ Endpoint ${endpoint} falhou:`, e.message);
        }
      }

      // Método 2: Tentar através de agentes de monitoramento conhecidos
      if (vpsIP) {
        const monitoringEndpoints = [
          `http://${vpsIP}:9100/metrics`, // Prometheus Node Exporter
          `http://${vpsIP}:19999/api/v1/data`, // Netdata
          `https://${vpsIP}/server-status?auto`, // Apache Status
          `http://${vpsIP}/nginx_status`, // Nginx Status
        ];

        for (const url of monitoringEndpoints) {
          try {
            console.log(`🔍 Tentando agente de monitoramento: ${url}`);
            
            // Tentar através de um proxy ou endpoint CORS-friendly
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json,text/plain,*/*',
              },
              signal: AbortSignal.timeout(5000) // 5 segundos timeout
            });

            if (response.ok) {
              const text = await response.text();
              const parsed = parseMonitoringData(text, url);
              
              if (parsed && hasValidMetrics(parsed)) {
                console.log(`✅ Métricas obtidas de agente de monitoramento:`, parsed);
                
                return {
                  ...normalizeMetrics(parsed),
                  source: 'monitoring_agent',
                  endpoint: url,
                  isReal: true,
                  lastUpdated: new Date().toISOString()
                };
              }
            }
          } catch (e) {
            console.log(`❌ Agente ${url} falhou:`, e.message);
          }
        }
      }

      // Método 3: Verificar logs ou dados históricos (comentado - sem tabela específica)
      /*
      try {
        const { data: storedMetrics } = await supabase
          .from('vps_metrics') // Tabela hipotética para armazenar métricas
          .select('*')
          .eq('vps_id', vpsId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (storedMetrics && hasValidMetrics(storedMetrics)) {
          console.log(`✅ Métricas encontradas no banco de dados:`, storedMetrics);
          
          return {
            ...normalizeMetrics(storedMetrics),
            source: 'database',
            isReal: true,
            lastUpdated: storedMetrics.created_at
          };
        }
      } catch (e) {
        console.log('❌ Nenhuma métrica encontrada no banco de dados:', e.message);
      }
      */

      // Se chegou até aqui, não foi possível obter métricas reais
      return null;
    },
    enabled: enabled && !!integrationId && !!vpsId,
    refetchInterval: 15000, // Tentar a cada 15 segundos para tempo real
    retry: 1,
    staleTime: 5000, // Considerar dados frescos por 5 segundos
  });
};

// Verifica se os dados contêm métricas válidas
function hasValidMetrics(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const metricFields = [
    'cpu_usage', 'cpu', 'cpu_percent',
    'memory_usage', 'memory', 'memory_percent', 'ram_usage',
    'disk_usage', 'disk', 'disk_percent', 'storage_usage',
    'network_in', 'network_out', 'rx_bytes', 'tx_bytes'
  ];

  return metricFields.some(field => 
    data[field] !== undefined && 
    data[field] !== null && 
    typeof data[field] === 'number'
  );
}

// Normaliza métricas de diferentes fontes para um formato padrão
function normalizeMetrics(data: any): any {
  const normalized: any = {};

  // CPU
  normalized.cpu_usage = data.cpu_usage || data.cpu || data.cpu_percent || 0;
  
  // Memória
  normalized.memory_usage = data.memory_usage || data.memory || data.memory_percent || data.ram_usage || 0;
  
  // Disco
  normalized.disk_usage = data.disk_usage || data.disk || data.disk_percent || data.storage_usage || 0;
  
  // Rede
  normalized.network_in = data.network_in || data.rx_bytes || 0;
  normalized.network_out = data.network_out || data.tx_bytes || 0;
  
  // Outros campos opcionais
  if (data.uptime !== undefined) normalized.uptime = data.uptime;
  if (data.load_average !== undefined) normalized.load_average = data.load_average;
  if (data.processes !== undefined) normalized.processes = data.processes;

  return normalized;
}

// Parse dados de diferentes agentes de monitoramento
function parseMonitoringData(text: string, url: string): any | null {
  try {
    // Tentar JSON primeiro
    return JSON.parse(text);
  } catch {
    // Se não for JSON, tentar parsear formatos específicos
    if (url.includes('prometheus') || url.includes('9100')) {
      return parsePrometheusMetrics(text);
    }
    
    if (url.includes('server-status')) {
      return parseApacheStatus(text);
    }
    
    return null;
  }
}

// Parse métricas do Prometheus Node Exporter
function parsePrometheusMetrics(text: string): any | null {
  const lines = text.split('\n');
  const metrics: any = {};
  
  for (const line of lines) {
    if (line.startsWith('node_cpu_seconds_total')) {
      // Parsear CPU
      const match = line.match(/node_cpu_seconds_total{.*?mode="idle".*?}\s+(\d+\.?\d*)/);
      if (match) {
        metrics.cpu_usage = Math.max(0, 100 - parseFloat(match[1]));
      }
    } else if (line.startsWith('node_memory_MemAvailable_bytes')) {
      // Parsear memória disponível
      const match = line.match(/node_memory_MemAvailable_bytes\s+(\d+)/);
      if (match) {
        metrics.memory_available = parseInt(match[1]);
      }
    } else if (line.startsWith('node_memory_MemTotal_bytes')) {
      // Parsear memória total
      const match = line.match(/node_memory_MemTotal_bytes\s+(\d+)/);
      if (match) {
        metrics.memory_total = parseInt(match[1]);
      }
    }
  }
  
  // Calcular uso de memória se temos total e disponível
  if (metrics.memory_total && metrics.memory_available) {
    metrics.memory_usage = ((metrics.memory_total - metrics.memory_available) / metrics.memory_total) * 100;
  }
  
  return Object.keys(metrics).length > 0 ? metrics : null;
}

// Parse status do Apache
function parseApacheStatus(text: string): any | null {
  const lines = text.split('\n');
  const metrics: any = {};
  
  for (const line of lines) {
    if (line.includes('CPULoad:')) {
      const match = line.match(/CPULoad:\s*(\d+\.?\d*)/);
      if (match) {
        metrics.cpu_usage = parseFloat(match[1]) * 100;
      }
    }
  }
  
  return Object.keys(metrics).length > 0 ? metrics : null;
}
