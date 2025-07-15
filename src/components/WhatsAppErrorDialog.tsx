
import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Copy, ExternalLink, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { EvolutionApiError } from '@/utils/evolutionApiService';

interface WhatsAppErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: EvolutionApiError | null;
}

export const WhatsAppErrorDialog = ({ open, onOpenChange, error }: WhatsAppErrorDialogProps) => {
  if (!error) return null;

  const copyErrorDetails = () => {
    const errorText = `
Erro WhatsApp Evolution API:
${error.message}

Detalhes: ${error.details || 'N/A'}
Endpoint: ${error.endpoint || 'N/A'}
Status: ${error.statusCode || 'N/A'}

Logs:
${error.logs?.join('\n') || 'Nenhum log disponível'}
    `.trim();

    navigator.clipboard.writeText(errorText);
    toast({
      title: "Erro copiado!",
      description: "Os detalhes do erro foram copiados para a área de transferência.",
    });
  };

  const getErrorSuggestions = () => {
    const suggestions = [];

    if (error.statusCode === 404) {
      suggestions.push("• Verifique se o nome da instância está correto");
      suggestions.push("• Confirme se a instância está criada e ativa na Evolution API");
      suggestions.push("• Verifique se a URL base está correta");
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      suggestions.push("• Verifique se o API Token está correto");
      suggestions.push("• Confirme se o token tem permissões para enviar mensagens");
    }

    if (error.message.includes('conexão') || error.message.includes('rede')) {
      suggestions.push("• Verifique sua conexão com a internet");
      suggestions.push("• Confirme se a URL da Evolution API está acessível");
    }

    if (suggestions.length === 0) {
      suggestions.push("• Verifique todas as configurações da Evolution API");
      suggestions.push("• Teste a conexão no painel administrativo");
      suggestions.push("• Confirme se a instância está conectada ao WhatsApp");
    }

    return suggestions;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Erro no Envio via WhatsApp
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Ocorreu um erro ao tentar enviar a mensagem via Evolution API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Erro principal */}
          <Alert className="bg-red-900/20 border-red-700">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-white">
              <strong>{error.message}</strong>
              {error.details && (
                <div className="mt-2 text-sm text-slate-300">
                  {error.details}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Informações técnicas */}
          {(error.endpoint || error.statusCode) && (
            <div className="bg-slate-700 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">Informações Técnicas:</h4>
              <div className="text-xs space-y-1 text-slate-300">
                {error.endpoint && (
                  <div><span className="text-slate-400">Endpoint:</span> {error.endpoint}</div>
                )}
                {error.statusCode && (
                  <div><span className="text-slate-400">Status HTTP:</span> {error.statusCode}</div>
                )}
              </div>
            </div>
          )}

          {/* Sugestões de solução */}
          <div className="bg-blue-900/20 border border-blue-700 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">💡 Sugestões para resolver:</h4>
            <ul className="text-xs text-slate-300 space-y-1">
              {getErrorSuggestions().map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>

          {/* Logs detalhados */}
          {error.logs && error.logs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Logs Detalhados:</h4>
              <ScrollArea className="h-32 bg-slate-900 p-3 rounded-lg">
                <div className="text-xs font-mono text-slate-300 space-y-1">
                  {error.logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-between gap-2 pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyErrorDetails}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Detalhes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/admin', '_blank')}
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                <Settings className="h-4 w-4 mr-1" />
                Configurações
              </Button>
            </div>
            
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
