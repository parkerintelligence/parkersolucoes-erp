import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Terminal, Network, Lock, CheckCircle, XCircle } from 'lucide-react';

export const WazuhConnectionTroubleshoot = () => {
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Problema de Conexão Detectado</AlertTitle>
        <AlertDescription>
          O Supabase não consegue se conectar ao servidor Wazuh. Siga os diagnósticos abaixo para identificar o problema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Diagnóstico Passo a Passo
          </CardTitle>
          <CardDescription>
            Execute cada teste para identificar onde está o problema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teste 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">Teste 1</Badge>
              <h4 className="font-semibold">Servidor Wazuh está rodando?</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Conecte via SSH ao servidor e verifique:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              sudo systemctl status wazuh-manager
            </pre>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Esperado:</strong> "active (running)" em verde</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <span><strong>Se não estiver rodando:</strong> <code>sudo systemctl start wazuh-manager</code></span>
            </div>
          </div>

          {/* Teste 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">Teste 2</Badge>
              <h4 className="font-semibold">API está respondendo localmente?</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              No servidor Wazuh, teste localmente:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              curl http://localhost:55000
            </pre>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Esperado:</strong> <code>{`{"title": "Wazuh API REST"}`}</code></span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <span><strong>Se der erro "Connection refused":</strong> A API não está configurada para HTTP. Vá para a aba "Guia de Setup"</span>
            </div>
          </div>

          {/* Teste 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">Teste 3</Badge>
              <h4 className="font-semibold">Firewall permite conexões?</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Verifique se a porta 55000 está aberta:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
{`sudo ufw status
# ou
sudo firewall-cmd --list-all`}
            </pre>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Esperado:</strong> Porta 55000 listada como ALLOW</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <span><strong>Se não estiver aberta:</strong></span>
            </div>
            <pre className="bg-muted p-3 rounded text-sm ml-6">
{`sudo ufw allow 55000/tcp
sudo ufw reload
# ou
sudo firewall-cmd --permanent --add-port=55000/tcp
sudo firewall-cmd --reload`}
            </pre>
          </div>

          {/* Teste 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600">Teste 4</Badge>
              <h4 className="font-semibold">Conectividade de rede externa</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Do seu computador (não do servidor), teste a conectividade:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              curl http://security.parkersolucoes.com.br:55000
            </pre>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Esperado:</strong> <code>{`{"title": "Wazuh API REST"}`}</code></span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <span><strong>Problemas possíveis:</strong></span>
            </div>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-6 space-y-1">
              <li><strong>Timeout:</strong> Firewall do servidor ou da rede bloqueando</li>
              <li><strong>Connection refused:</strong> Serviço não está escutando no IP público</li>
              <li><strong>No route to host:</strong> Problema de roteamento de rede</li>
            </ul>
          </div>

          {/* Teste 5 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-600">Teste 5</Badge>
              <h4 className="font-semibold">Configuração do arquivo api.yaml</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Verifique se o arquivo está configurado corretamente:
            </p>
            <pre className="bg-muted p-3 rounded text-sm">
              sudo cat /var/ossec/api/configuration/api.yaml
            </pre>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Deve conter:</strong></span>
            </div>
            <pre className="bg-muted p-3 rounded text-sm ml-6">
{`host: 0.0.0.0
port: 55000
https:
  enabled: no`}
            </pre>
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>ATENÇÃO:</strong> Se <code>host</code> estiver como <code>127.0.0.1</code> ou <code>localhost</code>, 
                o servidor só aceitará conexões locais. Deve ser <code>0.0.0.0</code> para aceitar conexões externas.
              </AlertDescription>
            </Alert>
          </div>

          {/* Teste 6 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600">Teste 6</Badge>
              <h4 className="font-semibold">Teste de autenticação</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Teste a autenticação diretamente:
            </p>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`curl -u usuario:senha -k -X GET "http://security.parkersolucoes.com.br:55000/security/user/authenticate?raw=true"`}
            </pre>
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span><strong>Esperado:</strong> Um token JWT longo</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <span><strong>Se der 401:</strong> Usuário ou senha incorretos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Problemas Comuns e Soluções</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">🔴 "connection closed before message completed"</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Causa:</strong> O servidor está tentando forçar HTTPS mas o certificado é auto-assinado.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Solução:</strong> Configure HTTP seguindo a aba "Guia de Setup" → HTTP (Recomendado)
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">🔴 "Connection refused" ou "ECONNREFUSED"</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Causa:</strong> O serviço não está rodando OU está escutando apenas em localhost
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Solução:</strong> Verifique <code>systemctl status wazuh-manager</code> e o campo <code>host: 0.0.0.0</code> no api.yaml
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">🔴 "Timeout" ou "ETIMEDOUT"</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Causa:</strong> Firewall bloqueando a porta 55000
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Solução:</strong> Configure o firewall (ufw/firewalld) para permitir a porta 55000
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">🔴 "Invalid peer certificate: UnknownIssuer"</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Causa:</strong> Tentando usar HTTPS com certificado auto-assinado
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Soluções:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground ml-4">
              <li>Opção 1: Use HTTP (mais simples)</li>
              <li>Opção 2: Instale certificado Let's Encrypt válido (veja aba "Guia de Setup" → HTTPS)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertDescription>
          <strong>Após resolver o problema:</strong> Volte para a aba "Conexão" e clique em "Testar Conexão" 
          para verificar se está funcionando.
        </AlertDescription>
      </Alert>
    </div>
  );
};
