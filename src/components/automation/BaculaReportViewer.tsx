import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronUp, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  HardDrive,
  Users,
  TrendingDown,
  FileText,
  Calendar
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface BaculaJob {
  name: string;
  status: string;
  client: string;
  datetime: string;
  bytes: number;
  files: number;
}

interface BaculaData {
  date: string;
  totalJobs: number;
  successJobs: number;
  errorJobs: number;
  affectedClients: number;
  recurringFailures: boolean;
  successJobs_list: BaculaJob[];
  errorJobs_list: BaculaJob[];
  canceledJobs_list: BaculaJob[];
  runningJobs_list: BaculaJob[];
  totalBytes: number;
  totalFiles: number;
  fallbackData: boolean;
}

interface BaculaReportViewerProps {
  messageContent: string;
}

export const BaculaReportViewer: React.FC<BaculaReportViewerProps> = ({ messageContent }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const parseBaculaReport = (content: string): BaculaData | null => {
    if (!content.includes('RELATÓRIO DIÁRIO BACULA')) {
      return null;
    }

    const data: BaculaData = {
      date: '',
      totalJobs: 0,
      successJobs: 0,
      errorJobs: 0,
      affectedClients: 0,
      recurringFailures: false,
      successJobs_list: [],
      errorJobs_list: [],
      canceledJobs_list: [],
      runningJobs_list: [],
      totalBytes: 0,
      totalFiles: 0,
      fallbackData: false
    };

    // Extract date
    const dateMatch = content.match(/RELATÓRIO DIÁRIO BACULA.*?(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) {
      data.date = dateMatch[1];
    }

    // Extract summary numbers
    const totalJobsMatch = content.match(/Total de Jobs:\s*(\d+)/);
    if (totalJobsMatch) {
      data.totalJobs = parseInt(totalJobsMatch[1]);
    }

    const errorJobsMatch = content.match(/Jobs com Erro:\s*(\d+)/);
    if (errorJobsMatch) {
      data.errorJobs = parseInt(errorJobsMatch[1]);
    }

    // Parse individual jobs - improved pattern for the actual format
    const lines = content.split('\n');
    let currentStatus = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect status headers
      if (line.includes('REALIZADO COM SUCESSO')) {
        currentStatus = 'Success';
        continue;
      } else if (line.includes('COM ERRO') || line.includes('FALHOU')) {
        currentStatus = 'Error';
        continue;
      } else if (line.includes('CANCELADO')) {
        currentStatus = 'Canceled';
        continue;
      } else if (line.includes('EM EXECUÇÃO')) {
        currentStatus = 'Running';
        continue;
      }
      
      // Parse job details - looking for the format from the example
      // TAVARES_SARTORI_-SRVDB004-_UAU_E_ANEXOS (TAVARES-SARTORI-SRVDB004) - 06/08/2025, 20:05 - 323.72 KB
      const jobMatch = line.match(/^([A-Z_\-\d]+)\s*\(([^)]+)\)\s*-\s*(\d{2}\/\d{2}\/\d{4}),?\s*(\d{2}:\d{2})\s*-\s*(.+)$/);
      
      if (jobMatch && currentStatus) {
        const [, jobName, client, date, time, sizeStr] = jobMatch;
        
        const job: BaculaJob = {
          name: jobName.trim(),
          status: currentStatus,
          client: client.trim(),
          datetime: `${date}, ${time}`,
          bytes: parseSizeString(sizeStr.trim()),
          files: 0 // This format doesn't include file count
        };

        data.totalBytes += job.bytes;

        if (['Error', 'Fatal'].includes(job.status)) {
          data.errorJobs_list.push(job);
        } else if (job.status === 'Success') {
          data.successJobs_list.push(job);
        } else if (job.status === 'Canceled') {
          data.canceledJobs_list.push(job);
        } else if (job.status === 'Running') {
          data.runningJobs_list.push(job);
        }
      }
    }

    data.successJobs = data.successJobs_list.length;
    data.errorJobs = data.errorJobs_list.length;
    data.affectedClients = new Set([...data.errorJobs_list, ...data.successJobs_list, ...data.canceledJobs_list, ...data.runningJobs_list].map(j => j.client)).size;
    data.recurringFailures = content.includes('FALHAS RECORRENTES');
    data.fallbackData = content.includes('fallback');

    return data;
  };

  const parseSizeString = (sizeStr: string): number => {
    const cleaned = sizeStr.replace(/[,.]/g, '').toLowerCase();
    const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?/);
    
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';
    
    const multipliers = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024,
      'tb': 1024 * 1024 * 1024 * 1024
    };
    
    return Math.round(value * (multipliers[unit as keyof typeof multipliers] || 1));
  };

  const parseBytes = (bytesStr: string): number => {
    const cleaned = bytesStr.replace(/[,.]/g, '');
    return parseInt(cleaned) || 0;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Success': { variant: 'default', className: 'bg-green-600 text-white', icon: CheckCircle },
      'Error': { variant: 'destructive', className: 'bg-red-600 text-white', icon: XCircle },
      'Fatal': { variant: 'destructive', className: 'bg-red-800 text-white', icon: XCircle },
      'Warning': { variant: 'secondary', className: 'bg-yellow-600 text-white', icon: AlertTriangle },
      'Running': { variant: 'outline', className: 'bg-blue-600 text-white', icon: Clock },
      'Canceled': { variant: 'outline', className: 'bg-gray-600 text-white', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Error;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const data = parseBaculaReport(messageContent);

  if (!data) {
    return (
      <div className="bg-gray-700 p-3 rounded-lg">
        <p className="text-sm text-gray-300 whitespace-pre-wrap">
          {messageContent}
        </p>
      </div>
    );
  }

  const successRate = data.totalJobs > 0 ? (data.successJobs / data.totalJobs) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Relatório Diário Bacula - {data.date}</h3>
        {data.fallbackData && (
          <Badge variant="outline" className="bg-orange-600 text-white border-orange-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Dados Fallback
          </Badge>
        )}
      </div>

      {/* Executive Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('summary')}
        >
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              Resumo Executivo
            </div>
            {expandedSections.has('summary') ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </CardTitle>
        </CardHeader>
        {expandedSections.has('summary') && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Total de Jobs</span>
                </div>
                <div className="text-2xl font-bold text-white">{data.totalJobs}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-300">Sucessos</span>
                </div>
                <div className="text-2xl font-bold text-green-400">{data.successJobs}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-300">Erros</span>
                </div>
                <div className="text-2xl font-bold text-red-400">{data.errorJobs}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Clientes</span>
                </div>
                <div className="text-2xl font-bold text-purple-400">{data.affectedClients}</div>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">Taxa de Sucesso</span>
                  <span className="text-white font-medium">{successRate.toFixed(1)}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <HardDrive className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-gray-300">Volume Total</span>
                  </div>
                  <div className="text-lg font-semibold text-cyan-400">{formatBytes(data.totalBytes)}</div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">Arquivos Processados</span>
                  </div>
                  <div className="text-lg font-semibold text-yellow-400">{formatNumber(data.totalFiles)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Jobs Cards Layout */}
      {data.errorJobs_list.length > 0 && (
        <Card className="bg-red-900/10 border-red-800">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('errors')}
          >
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                Jobs com Erro ({data.errorJobs_list.length})
              </div>
              {expandedSections.has('errors') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('errors') && (
            <CardContent>
              <div className="space-y-4">
                {data.errorJobs_list.map((job, index) => (
                  <div key={index} className="bg-red-900/20 border border-red-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status)}
                        <span className="text-sm font-medium text-red-300">FALHOU</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-white leading-tight">
                        {job.name}
                      </h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">Cliente:</span>
                        <span>{job.client}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4 text-green-400" />
                        <span className="font-medium">Data/Hora:</span>
                        <span>{job.datetime}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <HardDrive className="h-4 w-4 text-purple-400" />
                        <span className="font-medium">Tamanho:</span>
                        <span>{formatBytes(job.bytes)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-red-800/50 mt-3 pt-3">
                      <div className="h-px bg-gradient-to-r from-red-800/50 via-red-600/30 to-red-800/50"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {data.successJobs_list.length > 0 && (
        <Card className="bg-green-900/10 border-green-800">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('success')}
          >
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Jobs com Sucesso ({data.successJobs_list.length})
              </div>
              {expandedSections.has('success') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('success') && (
            <CardContent>
              <div className="space-y-4">
                {data.successJobs_list.map((job, index) => (
                  <div key={index} className="bg-green-900/20 border border-green-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(job.status)}
                        <span className="text-sm font-medium text-green-300">REALIZADO COM SUCESSO</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-white leading-tight">
                        {job.name}
                      </h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="font-medium">Cliente:</span>
                        <span>{job.client}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="h-4 w-4 text-green-400" />
                        <span className="font-medium">Data/Hora:</span>
                        <span>{job.datetime}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-300">
                        <HardDrive className="h-4 w-4 text-purple-400" />
                        <span className="font-medium">Tamanho:</span>
                        <span>{formatBytes(job.bytes)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-green-800/50 mt-3 pt-3">
                      <div className="h-px bg-gradient-to-r from-green-800/50 via-green-600/30 to-green-800/50"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Critical Analysis */}
      {(data.recurringFailures || data.errorJobs > 0) && (
        <Card className="bg-red-900/20 border-red-800">
          <CardHeader 
            className="cursor-pointer" 
            onClick={() => toggleSection('analysis')}
          >
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" />
                Análise Crítica
              </div>
              {expandedSections.has('analysis') ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
            </CardTitle>
          </CardHeader>
          {expandedSections.has('analysis') && (
            <CardContent>
              <div className="space-y-3">
                {data.errorJobs > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-300 mb-1">
                        Erros Detectados
                      </h4>
                      <p className="text-sm text-red-200">
                        {data.errorJobs} job(s) falharam na execução. 
                        Verifique os logs detalhados e conectividade com os clientes afetados.
                      </p>
                    </div>
                  </div>
                )}
                
                {data.recurringFailures && (
                  <div className="flex items-start gap-3 p-3 bg-orange-900/30 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-orange-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-300 mb-1">
                        Falhas Recorrentes
                      </h4>
                      <p className="text-sm text-orange-200">
                        Padrão de falhas repetidas detectado. 
                        Recomenda-se investigação imediata dos sistemas afetados.
                      </p>
                    </div>
                  </div>
                )}
                
                {successRate < 80 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-900/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-300 mb-1">
                        Taxa de Sucesso Baixa
                      </h4>
                      <p className="text-sm text-yellow-200">
                        Taxa de sucesso de {successRate.toFixed(1)}% está abaixo do esperado (&gt;90%). 
                        Revisar configurações e recursos do sistema.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};