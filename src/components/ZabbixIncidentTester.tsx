import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  Settings,
  Code,
  FileText,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ZabbixIncidentTester = () => {
  const { toast } = useToast();

  const webhookUrl = 'https://mpvxppgoyadwukkfoccs.supabase.co/functions/v1/zabbix-webhook';

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${description} copiado para a área de transferência.`,
    });
  };

  const javascriptCode = `// Webhook para integração com Supabase
var req = new HttpRequest();
req.addHeader('Content-Type: application/json');

var body = JSON.stringify({
    'problem_name': '{EVENT.NAME}',
    'host_name': '{HOST.NAME}',
    'severity': '{EVENT.SEVERITY}',
    'eventid': '{EVENT.ID}',
    'triggerid': '{TRIGGER.ID}',
    'status': '{EVENT.STATUS}',
    'timestamp': '{DATE} {TIME}',
    'item_key': '{ITEM.KEY}',
    'item_value': '{ITEM.LASTVALUE}'
});

Zabbix.log(4, '[Supabase Webhook] Sending: ' + body);

var response = req.post('${webhookUrl}', body);

Zabbix.log(4, '[Supabase Webhook] Response code: ' + req.getStatus());
Zabbix.log(4, '[Supabase Webhook] Response: ' + response);

if (req.getStatus() !== 200) {
    throw 'Response code: ' + req.getStatus();
}

return response;`;

  const xmlConfig = `<?xml version="1.0" encoding="UTF-8"?>
<zabbix_export>
    <version>6.0</version>
    <date>2025-07-11T21:00:00Z</date>
    <media_types>
        <media_type>
            <name>Supabase Webhook</name>
            <type>WEBHOOK</type>
            <parameters>
                <parameter>
                    <name>HTTPProxy</name>
                    <value/>
                </parameter>
                <parameter>
                    <name>Message</name>
                    <value>{ALERT.MESSAGE}</value>
                </parameter>
                <parameter>
                    <name>Subject</name>
                    <value>{ALERT.SUBJECT}</value>
                </parameter>
                <parameter>
                    <name>To</name>
                    <value>{ALERT.SENDTO}</value>
                </parameter>
                <parameter>
                    <name>URL</name>
                    <value>${webhookUrl}</value>
                </parameter>
            </parameters>
            <script>${javascriptCode.replace(/'/g, '&apos;')}</script>
            <timeout>30s</timeout>
            <process_tags>YES</process_tags>
            <show_event_menu>YES</show_event_menu>
            <event_menu_url/>
            <event_menu_name/>
            <description>Webhook para envio de alertas para Supabase</description>
            <message_templates>
                <message_template>
                    <event_source>TRIGGERS</event_source>
                    <operation_mode>PROBLEM</operation_mode>
                    <subject>Problema: {EVENT.NAME}</subject>
                    <message>Problema: {EVENT.NAME}
Host: {HOST.NAME}
Severidade: {EVENT.SEVERITY}
Status: {EVENT.STATUS}
Horário: {EVENT.TIME} {EVENT.DATE}</message>
                </message_template>
                <message_template>
                    <event_source>TRIGGERS</event_source>
                    <operation_mode>RECOVERY</operation_mode>
                    <subject>Resolvido: {EVENT.NAME}</subject>
                    <message>Problema resolvido: {EVENT.NAME}
Host: {HOST.NAME}
Duração: {EVENT.DURATION}
Horário: {EVENT.RECOVERY.TIME} {EVENT.RECOVERY.DATE}</message>
                </message_template>
            </message_templates>
        </media_type>
    </media_types>
</zabbix_export>`;

  const downloadConfig = () => {
    const blob = new Blob([xmlConfig], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase-webhook-mediatype.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado",
      description: "Arquivo de configuração baixado com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Configuração do Zabbix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* URL do Webhook */}
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              URL do Webhook
            </h3>
            <div className="bg-background p-3 rounded border border-border">
              <code className="text-green-400 text-sm break-all">{webhookUrl}</code>
              <Button
                onClick={() => copyToClipboard(webhookUrl, 'URL do webhook')}
                size="sm"
                variant="outline"
                className="ml-2 bg-secondary border-border text-foreground hover:bg-muted"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Instruções passo a passo */}
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold">📋 Configuração Passo a Passo</h3>
            <div className="bg-background p-4 rounded border border-border space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><Badge className="bg-blue-900/20 text-blue-400 border-blue-600 mr-2">1</Badge>
                   Acesse <strong>Administration → Media types</strong></p>
                <p><Badge className="bg-blue-900/20 text-blue-400 border-blue-600 mr-2">2</Badge>
                   Clique em <strong>Create media type</strong></p>
                <p><Badge className="bg-blue-900/20 text-blue-400 border-blue-600 mr-2">3</Badge>
                   Configure os dados:</p>
                <ul className="ml-8 space-y-1 text-muted-foreground">
                  <li>• <strong>Name:</strong> Supabase Webhook</li>
                  <li>• <strong>Type:</strong> Webhook</li>
                  <li>• <strong>Script:</strong> Use o código JavaScript abaixo</li>
                  <li>• <strong>Timeout:</strong> 30s</li>
                </ul>
                <p><Badge className="bg-blue-900/20 text-blue-400 border-blue-600 mr-2">4</Badge>
                   Salve e configure em <strong>Users → Media</strong></p>
              </div>
            </div>
          </div>

          {/* Código JavaScript */}
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Code className="h-4 w-4" />
              Código JavaScript para Media Type
            </h3>
            <div className="bg-background p-4 rounded border border-border">
              <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                <code>{javascriptCode}</code>
              </pre>
              <Button
                onClick={() => copyToClipboard(javascriptCode, 'Código JavaScript')}
                size="sm"
                variant="outline"
                className="mt-3 bg-secondary border-border text-foreground hover:bg-muted"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copiar Código
              </Button>
            </div>
          </div>

          {/* Download do arquivo */}
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Arquivo de Configuração
            </h3>
            <div className="bg-background p-4 rounded border border-border">
              <p className="text-muted-foreground text-sm mb-3">
                Baixe o arquivo XML com a configuração completa para importar diretamente no Zabbix:
              </p>
              <Button
                onClick={downloadConfig}
                className="bg-green-600 hover:bg-green-700 text-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar supabase-webhook-mediatype.xml
              </Button>
            </div>
          </div>

          {/* Importação */}
          <div className="space-y-3">
            <h3 className="text-foreground font-semibold">📥 Como Importar</h3>
            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <div className="space-y-2 text-sm text-blue-300">
                <p><strong>Para importar o arquivo:</strong></p>
                <p>1. <strong>Administration → General → Import</strong></p>
                <p>2. Selecione o arquivo <code>supabase-webhook-mediatype.xml</code></p>
                <p>3. Marque <strong>Media types</strong> e clique em <strong>Import</strong></p>
                <p>4. Configure o Media Type no usuário desejado</p>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};