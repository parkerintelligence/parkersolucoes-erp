import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useSystemSetting } from '@/hooks/useSystemSettings';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { toast } from 'sonner';

interface FileInfo {
  name: string;
  lastModified: Date;
  isDirectory: boolean;
  size: number;
}

interface BackupAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileInfo[];
  type: 'whatsapp' | 'glpi';
}

export const BackupAlertDialog = ({ open, onOpenChange, files, type }: BackupAlertDialogProps) => {
  const { data: integrations } = useIntegrations();
  const { createTicket } = useGLPIExpanded();
  const { data: alertHoursSetting } = useSystemSetting('ftp_backup_alert_hours', '48');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Obter o valor de horas da configuração
  const alertHours = alertHoursSetting ? parseInt(alertHoursSetting.setting_value) : 48;

  // Filtrar arquivos/pastas com mais de X horas sem modificação (configurável)
  const oldFiles = files.filter(file => {
    const hoursDiff = differenceInHours(new Date(), file.lastModified);
    return hoursDiff > alertHours;
  });

  const formatFilesList = () => {
    if (oldFiles.length === 0) {
      return "✅ Todos os backups estão atualizados!";
    }

    let message = `🚨 *ALERTA DE BACKUPS NÃO REALIZADOS*\n\n`;
    message += `⚠️ *${oldFiles.length} ${oldFiles.length === 1 ? 'item encontrado' : 'itens encontrados'}* com mais de ${alertHours} horas sem modificação:\n\n`;

    oldFiles.forEach((file, index) => {
      const hoursDiff = differenceInHours(new Date(), file.lastModified);
      const daysDiff = Math.floor(hoursDiff / 24);
      
      message += `${index + 1}. 📁 *${file.name}*\n`;
      message += `   📅 Último backup: ${format(file.lastModified, 'dd/MM/yyyy HH:mm', { locale: ptBR })}\n`;
      message += `   ⏰ Há ${daysDiff} dias atrás\n\n`;
    });

    message += `📊 *Resumo:*\n`;
    message += `• Total de itens verificados: ${files.length}\n`;
    message += `• Itens desatualizados: ${oldFiles.length}\n`;
    message += `• Itens atualizados: ${files.length - oldFiles.length}\n\n`;
    message += `🕒 Relatório gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`;

    return message;
  };

  const handleWhatsAppSend = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Número obrigatório", {
        description: "Digite o número do WhatsApp para enviar o alerta."
      });
      return;
    }

    const evolutionApiIntegration = integrations?.find(int => int.type === 'evolution_api');
    
    if (!evolutionApiIntegration) {
      toast.error("Evolution API não configurada", {
        description: "Configure a Evolution API no painel administrativo."
      });
      return;
    }

    setIsLoading(true);
    try {
      const integrationAny = evolutionApiIntegration as any;
      const instanceName = integrationAny.instance_name || 'main_instance';
      const message = formatFilesList();

      const response = await fetch(`${evolutionApiIntegration.base_url}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiIntegration.api_token || '',
        },
        body: JSON.stringify({
          number: phoneNumber.replace(/\D/g, ''),
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem');
      }

      toast.success("✅ Alerta enviado!", {
        description: `Relatório de backup enviado para ${phoneNumber}`
      });
      
      onOpenChange(false);
      setPhoneNumber('');
    } catch (error) {
      toast.error("❌ Erro ao enviar", {
        description: "Não foi possível enviar o alerta via WhatsApp."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGLPITicket = async () => {
    setIsLoading(true);
    try {
      const message = formatFilesList();
      
      const ticketData = {
        name: `Backups não realizados - Alerta`,
        content: message.replace(/\*/g, '').replace(/📁|📅|⏰|📊|🕒|✅|🚨|⚠️/g, ''),
        urgency: oldFiles.length > 0 ? 4 : 2,
        impact: oldFiles.length > 0 ? 4 : 2,
        priority: oldFiles.length > 0 ? 4 : 2,
        status: 1,
        type: 1,
      };

      await createTicket.mutateAsync(ticketData);
      toast.success("✅ Ticket criado!", {
        description: "Chamado de backup criado no GLPI com sucesso."
      });
      
      onOpenChange(false);
    } catch (error) {
      toast.error("❌ Erro ao criar ticket", {
        description: "Não foi possível criar o chamado no GLPI."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {type === 'whatsapp' ? (
              <>
                <MessageCircle className="h-5 w-5 text-green-400" />
                Enviar Alerta via WhatsApp
              </>
            ) : (
              <>
                <ExternalLink className="h-5 w-5 text-blue-400" />
                Criar Chamado GLPI
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {type === 'whatsapp' 
              ? 'Envie um relatório dos backups não realizados via WhatsApp'
              : 'Crie um chamado no GLPI para os backups não realizados'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo dos arquivos */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Resumo do relatório:</h4>
            <div className="text-xs space-y-1">
              <p><strong>Parâmetro de alerta:</strong> {alertHours} horas</p>
              <p><strong>Total de itens:</strong> {files.length}</p>
              <p><strong>Itens desatualizados ({`>${alertHours}h`}):</strong>
                <span className={oldFiles.length > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {oldFiles.length}
                </span>
              </p>
              <p><strong>Itens atualizados:</strong> 
                <span className="text-green-600 font-medium">{files.length - oldFiles.length}</span>
              </p>
            </div>
          </div>

          {/* Lista de arquivos desatualizados */}
          {oldFiles.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Itens com backup pendente:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {oldFiles.slice(0, 5).map((file, index) => {
                  const daysDiff = Math.floor(differenceInHours(new Date(), file.lastModified) / 24);
                  return (
                    <div key={index} className="text-xs text-red-700">
                      <span className="font-medium">{file.name}</span> - {daysDiff} dias atrás
                    </div>
                  );
                })}
                {oldFiles.length > 5 && (
                  <div className="text-xs text-red-600 font-medium">
                    ... e mais {oldFiles.length - 5} itens
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campo de número (apenas para WhatsApp) */}
          {type === 'whatsapp' && (
            <div className="space-y-2">
              <Label htmlFor="phone">Número do WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ex: 5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Digite o número completo com código do país (ex: 5511999999999)
              </p>
            </div>
          )}

          {/* Preview da mensagem */}
          <div className="space-y-2">
            <Label>Preview da mensagem:</Label>
            <Textarea
              value={formatFilesList()}
              readOnly
              rows={6}
              className="resize-none text-xs font-mono"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={type === 'whatsapp' ? handleWhatsAppSend : handleGLPITicket}
              disabled={isLoading || (type === 'whatsapp' && !phoneNumber.trim())}
              className={type === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {isLoading ? (
                'Enviando...'
              ) : type === 'whatsapp' ? (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Criar Chamado
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};