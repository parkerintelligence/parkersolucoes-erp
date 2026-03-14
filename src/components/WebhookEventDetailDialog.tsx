import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Zap, Clock, CheckCircle2, XCircle, MessageCircle, Mail,
  Copy, ExternalLink, FileJson, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebhookEventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logId: string | null;
}

export const WebhookEventDetailDialog = ({
  open,
  onOpenChange,
  logId,
}: WebhookEventDetailDialogProps) => {
  const [log, setLog] = useState<any>(null);
  const [webhook, setWebhook] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !logId) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        // Fetch log
        const { data: logData } = await supabase
          .from('webhook_logs' as any)
          .select('*')
          .eq('id', logId)
          .single();

        if (!logData) return;
        setLog(logData);

        // Fetch webhook info
        const { data: webhookData } = await supabase
          .from('webhooks' as any)
          .select('*')
          .eq('id', (logData as any).webhook_id)
          .single();
        setWebhook(webhookData);

        // Fetch actions for this webhook
        const { data: actionsData } = await supabase
          .from('webhook_actions' as any)
          .select('*')
          .eq('webhook_id', (logData as any).webhook_id);
        setActions(actionsData || []);
      } catch (err) {
        console.error('Error fetching webhook details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, logId]);

  const copyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    toast.success('JSON copiado!');
  };

  const responseData = log?.response_data;
  const requestBody = log?.request_body;
  const isTest = log?.is_test;
  const status = log?.status;
  const createdAt = log?.created_at;

  // Extract action results from response_data
  const actionResults: Array<{ action: any; success: boolean; error?: string }> = [];
  if (responseData && typeof responseData === 'object') {
    if (Array.isArray(responseData.results)) {
      responseData.results.forEach((r: any, i: number) => {
        const matchedAction = actions[i] || null;
        actionResults.push({
          action: matchedAction || { action_type: r.action_type || 'unknown', destination: r.destination || '—' },
          success: r.success ?? r.status === 'success',
          error: r.error || r.message,
        });
      });
    } else if (responseData.actions && Array.isArray(responseData.actions)) {
      responseData.actions.forEach((r: any, i: number) => {
        const matchedAction = actions[i] || null;
        actionResults.push({
          action: matchedAction || { action_type: r.type || 'unknown', destination: r.destination || '—' },
          success: r.success ?? true,
          error: r.error,
        });
      });
    }
  }

  // If no results extracted but we have actions, show them without result
  if (actionResults.length === 0 && actions.length > 0) {
    actions.forEach((a) => {
      actionResults.push({
        action: a,
        success: status === 'success',
        error: status !== 'success' ? 'Sem detalhes de resultado' : undefined,
      });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[85vh] border-border bg-card p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-foreground text-lg">
                {isTest ? '🧪 Evento de Teste' : '🔔 Evento de Webhook'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {webhook?.name || 'Carregando...'}
                {webhook?.slug && (
                  <span className="ml-2 text-xs text-muted-foreground/70">/{webhook.slug}</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-100px)]">
          <div className="px-6 pb-6 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Carregando detalhes...</div>
            ) : !log ? (
              <div className="py-12 text-center text-muted-foreground">Evento não encontrado.</div>
            ) : (
              <>
                {/* Status & Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Status</span>
                    <div className="flex items-center gap-2">
                      {status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge variant={status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {status === 'success' ? 'Sucesso' : 'Erro'}
                      </Badge>
                      {isTest && (
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                          Teste
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Recebido em</span>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {createdAt
                        ? format(new Date(createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
                        : '—'}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Payload Recebido</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyJson(requestBody)}>
                      <Copy className="h-3 w-3 mr-1" /> Copiar
                    </Button>
                  </div>
                  {requestBody && typeof requestBody === 'object' ? (
                    <div className="space-y-1">
                      {Object.entries(requestBody).map(([key, value]) => (
                        <div key={key} className="flex gap-2 text-xs bg-muted/20 rounded px-3 py-1.5">
                          <span className="text-primary font-mono font-semibold min-w-[100px] flex-shrink-0">{key}:</span>
                          <span className="text-foreground/80 font-mono break-all">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="text-xs bg-muted/20 rounded p-3 text-foreground/80 font-mono overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(requestBody, null, 2) || 'Nenhum payload'}
                    </pre>
                  )}
                </div>

                <Separator />

                {/* Actions executed */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">
                      Ações Executadas ({actionResults.length})
                    </span>
                  </div>

                  {actionResults.length === 0 ? (
                    <div className="text-xs text-muted-foreground bg-muted/20 rounded p-3">
                      Nenhuma ação configurada para este webhook.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {actionResults.map((result, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border p-3 space-y-2 ${
                            result.success
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-destructive/30 bg-destructive/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.action?.action_type === 'whatsapp' ? (
                                <MessageCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Mail className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="text-xs font-semibold text-foreground uppercase">
                                {result.action?.action_type || 'Ação'}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-foreground/80 font-mono">
                                {result.action?.destination || '—'}
                              </span>
                            </div>
                            {result.success ? (
                              <Badge variant="default" className="text-[10px] bg-green-600 hover:bg-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Enviado
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px]">
                                <XCircle className="h-3 w-3 mr-1" /> Falhou
                              </Badge>
                            )}
                          </div>

                          {/* Show template if available */}
                          {result.action?.message_template && (
                            <div className="text-[11px] text-muted-foreground bg-background/50 rounded p-2 font-mono break-all">
                              <span className="text-[10px] text-muted-foreground/60 uppercase block mb-1">Template:</span>
                              {result.action.message_template}
                            </div>
                          )}

                          {/* Show error if failed */}
                          {!result.success && result.error && (
                            <div className="text-[11px] text-destructive bg-destructive/10 rounded p-2 font-mono break-all">
                              <span className="text-[10px] text-destructive/60 uppercase block mb-1">Erro:</span>
                              {result.error}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Raw Response */}
                {responseData && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Resposta Completa (JSON)
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => copyJson(responseData)}>
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </Button>
                      </div>
                      <pre className="text-[11px] bg-muted/20 rounded p-3 text-foreground/70 font-mono overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {JSON.stringify(responseData, null, 2)}
                      </pre>
                    </div>
                  </>
                )}

                {/* Footer action */}
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = '/webhooks';
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ir para Webhooks
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
