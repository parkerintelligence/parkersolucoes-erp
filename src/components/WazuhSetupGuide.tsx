import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Terminal, FileText, CheckCircle, Server } from 'lucide-react';

export const WazuhSetupGuide = () => {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-orange-400" />
          <div>
            <CardTitle className="text-white">Guia de Configuração do Servidor Wazuh</CardTitle>
            <CardDescription className="text-slate-400">
              Configure o Wazuh para aceitar conexões HTTP do Supabase Edge Functions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-red-900/20 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            <strong>Problema Identificado:</strong> O servidor Wazuh está configurado apenas para HTTPS 
            com certificado auto-assinado. Supabase Edge Functions não pode verificar certificados auto-assinados.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-400" />
            Passos para Configurar HTTP no Wazuh
          </h3>

          <div className="space-y-4">
            {/* Passo 1 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">1</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Conecte ao servidor Wazuh via SSH</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600">
                    <code className="text-green-400 text-sm">
                      ssh usuario@security.parkersolucoes.com.br
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">2</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Edite o arquivo de configuração da API</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600">
                    <code className="text-green-400 text-sm">
                      sudo nano /var/ossec/api/configuration/api.yaml
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">3</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Modifique a configuração HTTPS</p>
                  <p className="text-sm text-slate-300">Procure a seção <code className="text-orange-400">https:</code> e altere:</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600 space-y-1">
                    <p className="text-slate-500 text-sm"># Antes (HTTPS):</p>
                    <code className="text-red-400 text-sm block">https:</code>
                    <code className="text-red-400 text-sm block">  enabled: yes</code>
                    <code className="text-red-400 text-sm block">  key: "api/configuration/ssl/server.key"</code>
                    <code className="text-red-400 text-sm block">  cert: "api/configuration/ssl/server.crt"</code>
                    <Separator className="my-2 bg-slate-600" />
                    <p className="text-slate-500 text-sm"># Depois (HTTP):</p>
                    <code className="text-green-400 text-sm block">https:</code>
                    <code className="text-green-400 text-sm block">  enabled: no</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">4</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Configure o host e porta (se necessário)</p>
                  <p className="text-sm text-slate-300">Certifique-se que a API está ouvindo em todas as interfaces:</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600">
                    <code className="text-green-400 text-sm block">host: 0.0.0.0</code>
                    <code className="text-green-400 text-sm block">port: 55000</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 5 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">5</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Salve o arquivo</p>
                  <p className="text-sm text-slate-300">No nano: <code className="text-orange-400">Ctrl+X</code>, depois <code className="text-orange-400">Y</code>, depois <code className="text-orange-400">Enter</code></p>
                </div>
              </div>
            </div>

            {/* Passo 6 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">6</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Reinicie o Wazuh Manager</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600">
                    <code className="text-green-400 text-sm">
                      sudo systemctl restart wazuh-manager
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 7 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">7</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Verifique o status do serviço</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600 space-y-1">
                    <code className="text-green-400 text-sm block">sudo systemctl status wazuh-manager</code>
                    <p className="text-slate-400 text-xs mt-2">Deve mostrar "active (running)"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo 8 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 text-white">8</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Teste a conexão HTTP localmente</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600">
                    <code className="text-green-400 text-sm">
                      curl http://localhost:55000/
                    </code>
                  </div>
                  <p className="text-sm text-slate-400">Deve retornar informações da API do Wazuh</p>
                </div>
              </div>
            </div>

            {/* Passo 9 */}
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-600 text-white">9</Badge>
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-white">Configure o Firewall (se necessário)</p>
                  <div className="bg-slate-900 p-3 rounded border border-slate-600 space-y-1">
                    <code className="text-green-400 text-sm block">sudo ufw allow 55000/tcp</code>
                    <p className="text-slate-400 text-xs mt-2">Permite conexões externas na porta 55000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-slate-600" />

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Exemplo de Configuração Completa
          </h3>
          <div className="bg-slate-900 p-4 rounded border border-slate-600">
            <pre className="text-green-400 text-sm overflow-x-auto">
{`# /var/ossec/api/configuration/api.yaml

host: 0.0.0.0
port: 55000

# Desabilitar HTTPS para permitir HTTP
https:
  enabled: no

# Configurações de logging
logs:
  level: info

# Configurações de CORS (se necessário)
cors:
  enabled: yes
  source_route: "*"
  expose_headers: "*"
  allow_headers: "*"
  allow_credentials: yes`}
            </pre>
          </div>
        </div>

        <Alert className="bg-green-900/20 border-green-700">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            <strong>Após configurar:</strong> Volte para a aba "Conexão" e clique em "Testar Conexão" 
            com a URL <code className="text-orange-400">http://security.parkersolucoes.com.br:55000</code>
          </AlertDescription>
        </Alert>

        <Alert className="bg-yellow-900/20 border-yellow-700">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            <strong>Nota de Segurança:</strong> HTTP não é criptografado. Se estiver em rede pública, 
            considere usar um VPN ou túnel SSH. Para produção, instale um certificado SSL válido de uma CA confiável.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
