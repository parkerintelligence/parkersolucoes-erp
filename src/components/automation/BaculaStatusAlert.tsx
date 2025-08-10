import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useScheduledReports } from '@/hooks/useScheduledReports';

export const BaculaStatusAlert = () => {
  const { data: integrations = [] } = useIntegrations();
  const { data: reports = [] } = useScheduledReports();
  
  const baculaIntegration = integrations.find(i => i.type === 'bacula' && i.is_active);
  const baculaReports = reports.filter(r => r.name.toLowerCase().includes('bacula'));
  const activeBaculaReports = baculaReports.filter(r => r.is_active);
  
  const hasUserToken = baculaIntegration && (baculaIntegration as any).user_token;
  const hasMultipleActiveReports = activeBaculaReports.length > 1;
  const hasNoActiveReports = activeBaculaReports.length === 0;
  
  const getStatusColor = () => {
    if (hasNoActiveReports || !baculaIntegration) return 'bg-red-950 border-red-800';
    if (!hasUserToken || hasMultipleActiveReports) return 'bg-yellow-950 border-yellow-800';
    return 'bg-green-950 border-green-800';
  };
  
  const getStatusIcon = () => {
    if (hasNoActiveReports || !baculaIntegration) return <AlertTriangle className="h-5 w-5 text-red-400" />;
    if (!hasUserToken || hasMultipleActiveReports) return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    return <CheckCircle className="h-5 w-5 text-green-400" />;
  };
  
  const getStatusTitle = () => {
    if (!baculaIntegration) return 'Integração Bacula Não Configurada';
    if (hasNoActiveReports) return 'Nenhum Relatório Bacula Ativo';
    if (!hasUserToken) return 'Autenticação de Relatórios Pendente';
    if (hasMultipleActiveReports) return 'Múltiplos Agendamentos Ativos';
    return 'Sistema Bacula Configurado Corretamente';
  };
  
  const getStatusDescription = () => {
    if (!baculaIntegration) {
      return 'Configure a integração Bacula no painel de Administração para habilitar relatórios automáticos.';
    }
    if (hasNoActiveReports) {
      return 'Não há relatórios Bacula ativos. Ative o agendamento na aba "Gerenciar" para receber relatórios automáticos.';
    }
    if (!hasUserToken) {
      return 'A integração Bacula precisa ser reconfigurada para incluir o token de autenticação. Edite a integração no painel de Administração.';
    }
    if (hasMultipleActiveReports) {
      return `Existem ${activeBaculaReports.length} agendamentos Bacula ativos. Recomenda-se manter apenas um para evitar duplicatas.`;
    }
    return 'O sistema está configurado corretamente. Os relatórios automáticos usarão dados reais do Bacula.';
  };
  
  const getRecommendations = () => {
    const recommendations = [];
    
    if (!baculaIntegration) {
      recommendations.push('Acesse Admin → Configurações Bacula para criar a integração');
    }
    
    if (hasNoActiveReports && baculaIntegration) {
      recommendations.push('Use a aba "Gerenciar" para ativar o relatório Bacula');
    }
    
    if (!hasUserToken && baculaIntegration) {
      recommendations.push('Reconfigurar a integração Bacula salvará automaticamente o token de autenticação');
    }
    
    if (hasMultipleActiveReports) {
      recommendations.push('Use a aba "Gerenciar" para desativar relatórios duplicados');
      recommendations.push('Mantenha apenas o "Relatório Diário de Erros Bacula" ativo');
    }
    
    return recommendations;
  };
  
  return (
    <Card className={`${getStatusColor()} mb-6`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-white">{getStatusTitle()}</h3>
              <Badge variant="outline" className="text-xs">
                {baculaReports.length} agendamento{baculaReports.length !== 1 ? 's' : ''} Bacula
              </Badge>
            </div>
            
            <p className="text-sm text-gray-300 mb-3">
              {getStatusDescription()}
            </p>
            
            {getRecommendations().length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
                  <Info className="h-4 w-4" />
                  Ações Recomendadas:
                </div>
                <ul className="text-sm text-gray-300 space-y-1 ml-6">
                  {getRecommendations().map((rec, index) => (
                    <li key={index} className="list-disc">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {activeBaculaReports.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-sm text-gray-300">
                  <strong>Relatórios Ativos:</strong>
                  <div className="mt-1 space-y-1">
                    {activeBaculaReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between">
                        <span>{report.name}</span>
                        <span className="text-xs text-gray-400">
                          {report.cron_expression}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};