
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, AlertTriangle, Bug } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface WhatsAppErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: {
    message: string;
    details?: string;
    endpoint?: string;
    statusCode?: number;
    logs?: string[];
  };
}

export const WhatsAppErrorDialog = ({ open, onOpenChange, error }: WhatsAppErrorDialogProps) => {
  const copyErrorDetails = () => {
    const errorInfo = `
Erro no WhatsApp:
- Mensagem: ${error.message}
- Endpoint: ${error.endpoint || 'N/A'}
- Status Code: ${error.statusCode || 'N/A'}
- Detalhes: ${error.details || 'N/A'}
- Logs: ${error.logs?.join('\n') || 'Nenhum log disponível'}
- Timestamp: ${new Date().toLocaleString('pt-BR')}
    `.trim();

    navigator.clipboard.writeText(errorInfo);
    toast({
      title: "Informações copiadas!",
      description: "Detalhes do erro foram copiados para a área de transferência.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Erro no Envio do WhatsApp
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Ocorreu um erro ao tentar enviar a mensagem via WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Erro principal */}
          <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {error.message}
            </AlertDescription>
          </Alert>

          {/* Detalhes técnicos */}
          {(error.details || error.endpoint || error.statusCode) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Detalhes Técnicos
              </h4>
              <div className="bg-slate-900 p-3 rounded-md text-xs font-mono text-slate-300 space-y-1">
                {error.endpoint && (
                  <div><span className="text-blue-400">Endpoint:</span> {error.endpoint}</div>
                )}
                {error.statusCode && (
                  <div><span className="text-blue-400">Status Code:</span> {error.statusCode}</div>
                )}
                {error.details && (
                  <div><span className="text-blue-400">Detalhes:</span> {error.details}</div>
                )}
              </div>
            </div>
          )}

          {/* Logs */}
          {error.logs && error.logs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Logs de Debug</h4>
              <div className="bg-slate-900 p-3 rounded-md text-xs font-mono text-slate-300 max-h-32 overflow-y-auto">
                {error.logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Possíveis soluções */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Possíveis Soluções</h4>
            <div className="text-sm text-slate-400 space-y-1">
              <div>• Verifique se a instância da Evolution API está ativa</div>
              <div>• Confirme se o token da API está correto</div>
              <div>• Verifique se a URL base está correta</div>
              <div>• Confirme se o nome da instância está correto</div>
              <div>• Verifique se o número do WhatsApp está conectado</div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={copyErrorDetails}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Detalhes
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-slate-600 hover:bg-slate-700"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
