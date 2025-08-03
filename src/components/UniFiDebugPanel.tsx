import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface UniFiDebugPanelProps {
  sites?: any;
  sitesLoading: boolean;
  sitesError?: any;
}

export const UniFiDebugPanel: React.FC<UniFiDebugPanelProps> = ({
  sites,
  sitesLoading,
  sitesError
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-amber-900/20 border-amber-500/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-amber-900/10 transition-colors">
            <CardTitle className="text-amber-400 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Debug API - Dados Brutos dos Sites
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sitesLoading ? "secondary" : sitesError ? "destructive" : "default"}>
                  {sitesLoading ? "Carregando..." : sitesError ? "Erro" : "Dados Carregados"}
                </Badge>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Status da Requisição */}
              <div className="flex items-center gap-2 text-sm">
                {sitesLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-400"></div>
                    <span className="text-amber-300">Carregando dados da API...</span>
                  </>
                ) : sitesError ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-300">Erro ao carregar: {sitesError?.message || 'Erro desconhecido'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-300">Dados carregados com sucesso</span>
                  </>
                )}
              </div>

              {/* Dados Brutos */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-white text-sm font-medium mb-2">Dados Brutos da API:</h4>
                <pre className="text-xs text-gray-300 bg-slate-900 rounded p-3 overflow-auto max-h-64">
                  {JSON.stringify(sites, null, 2) || 'Nenhum dado disponível'}
                </pre>
              </div>

              {/* Análise dos Dados */}
              {sites && (
                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-white text-sm font-medium mb-2">Análise dos Dados:</h4>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p><strong>Tipo da resposta:</strong> {typeof sites}</p>
                    <p><strong>Tem propriedade 'data':</strong> {sites.data ? 'Sim' : 'Não'}</p>
                    <p><strong>É array:</strong> {Array.isArray(sites) ? 'Sim' : 'Não'}</p>
                    <p><strong>É array em 'data':</strong> {Array.isArray(sites?.data) ? 'Sim' : 'Não'}</p>
                    <p><strong>Número de itens:</strong> {
                      Array.isArray(sites) ? sites.length : 
                      Array.isArray(sites?.data) ? sites.data.length : 
                      'N/A'
                    }</p>
                    
                    {/* Propriedades do objeto */}
                    {sites && typeof sites === 'object' && (
                      <div className="mt-2">
                        <p><strong>Propriedades encontradas:</strong></p>
                        <ul className="ml-4">
                          {Object.keys(sites).map(key => (
                            <li key={key}>• {key}: {typeof sites[key]}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Primeiro item se existir */}
                    {(Array.isArray(sites) ? sites[0] : Array.isArray(sites?.data) ? sites.data[0] : null) && (
                      <div className="mt-2">
                        <p><strong>Estrutura do primeiro item:</strong></p>
                        <ul className="ml-4">
                          {Object.keys(Array.isArray(sites) ? sites[0] : sites.data[0]).map(key => (
                            <li key={key}>• {key}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};