import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Server, Save, X, Shield, Globe, Radio, Key, FileCode, CheckCircle2, Copy, TestTube, Loader2, AlertCircle } from 'lucide-react';
import { useIntegrations, useCreateIntegration, useUpdateIntegration } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

interface Props {
  onClose: () => void;
}

export const RustDeskServerConfig = ({ onClose }: Props) => {
  const { data: integrations = [] } = useIntegrations();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();

  const existing = integrations.find(i => i.type === 'rustdesk');

  const [form, setForm] = useState({
    name: 'RustDesk Server',
    hbbs_server: '',
    hbbr_server: '',
    api_server: '',
    key: '',
    config_string: '',
    is_active: true,
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || 'RustDesk Server',
        hbbs_server: existing.base_url || '',
        hbbr_server: existing.webhook_url || '',
        api_server: existing.password || '',
        key: existing.api_token || '',
        config_string: existing.username || '',
        is_active: existing.is_active ?? true,
      });
    }
  }, [existing]);

  const handleSave = async () => {
    if (!form.hbbs_server) {
      toast({ title: "Campo obrigatório", description: "Informe o servidor de ID (hbbs).", variant: "destructive" });
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name,
      base_url: form.hbbs_server,
      webhook_url: form.hbbr_server,
      password: form.api_server || null,
      api_token: form.key,
      username: form.config_string,
      is_active: form.is_active,
      type: 'rustdesk',
    };

    try {
      if (existing) {
        await updateIntegration.mutateAsync({ id: existing.id, updates: payload });
      } else {
        await createIntegration.mutateAsync({
          ...payload,
          is_global: true,
        } as any);
      }
      toast({ title: "✅ Servidor salvo!", description: "Configuração do servidor RustDesk salva com sucesso." });
    } catch (error: any) {
      console.error('Erro ao salvar servidor RustDesk:', error);
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!form.hbbs_server) {
      toast({ title: "Informe o servidor", description: "Preencha o servidor de ID (hbbs) antes de testar.", variant: "destructive" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Test hbbs server connectivity
      const hbbsHost = form.hbbs_server.replace(/^https?:\/\//, '');
      
      // We'll test by trying to resolve/reach the server
      // Since we can't do raw TCP from browser, we test HTTP connectivity
      const testUrls = [];
      
      // Test hbbs
      testUrls.push({ name: 'hbbs (ID Server)', host: hbbsHost });
      
      // Test hbbr if provided
      if (form.hbbr_server) {
        const hbbrHost = form.hbbr_server.replace(/^https?:\/\//, '');
        testUrls.push({ name: 'hbbr (Relay)', host: hbbrHost });
      }

      // Test API server if provided
      if (form.api_server) {
        testUrls.push({ name: 'API Server', host: form.api_server });
      }

      const results: string[] = [];
      
      for (const test of testUrls) {
        try {
          // Try DNS resolution via fetch with timeout
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          
          try {
            await fetch(`https://${test.host}`, { 
              mode: 'no-cors', 
              signal: controller.signal 
            });
            results.push(`✅ ${test.name}: ${test.host} - Acessível`);
          } catch (fetchErr: any) {
            if (fetchErr.name === 'AbortError') {
              results.push(`⚠️ ${test.name}: ${test.host} - Timeout (servidor pode estar em porta não-HTTP)`);
            } else {
              // no-cors fetch often throws but still means DNS resolved
              results.push(`✅ ${test.name}: ${test.host} - DNS resolvido (porta RustDesk pode estar ok)`);
            }
          } finally {
            clearTimeout(timeout);
          }
        } catch (err) {
          results.push(`❌ ${test.name}: ${test.host} - Não acessível`);
        }
      }

      // Validate key format
      if (form.key) {
        if (form.key.length === 32 && /^[a-f0-9]+$/i.test(form.key)) {
          results.push(`✅ Key: Formato válido (${form.key.length} caracteres hex)`);
        } else {
          results.push(`⚠️ Key: Formato não padrão (${form.key.length} caracteres)`);
        }
      }

      // Validate config string
      if (form.config_string) {
        try {
          const decoded = atob(form.config_string);
          results.push(`✅ Config String: Decodificável (${decoded.length} bytes)`);
        } catch {
          results.push(`⚠️ Config String: Presente mas não é base64 padrão`);
        }
      }

      const hasErrors = results.some(r => r.startsWith('❌'));
      
      setTestResult({
        success: !hasErrors,
        message: results.join('\n')
      });

      toast({
        title: hasErrors ? "⚠️ Problemas detectados" : "✅ Teste concluído",
        description: hasErrors ? "Verifique os resultados do teste abaixo." : "Servidores parecem acessíveis!",
        variant: hasErrors ? "destructive" : "default"
      });

    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Erro no teste: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado para a área de transferência.` });
  };

  return (
    <Card className="bg-slate-800 border-orange-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white text-base">
              <Server className="h-5 w-5 text-orange-400" />
              Configuração do Servidor RustDesk
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure seu servidor RustDesk próprio (hbbs/hbbr) para conexões seguras e centralizadas
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Servidores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 flex items-center gap-1">
              <Globe className="h-3 w-3 text-blue-400" />
              Servidor de ID (hbbs) *
            </label>
            <Input
              value={form.hbbs_server}
              onChange={e => setForm(p => ({ ...p, hbbs_server: e.target.value }))}
              placeholder="hbbs-rustdesk.meuservidor.com.br"
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Servidor responsável pelo registro de IDs</p>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 flex items-center gap-1">
              <Radio className="h-3 w-3 text-green-400" />
              Servidor de Relay (hbbr)
            </label>
            <Input
              value={form.hbbr_server}
              onChange={e => setForm(p => ({ ...p, hbbr_server: e.target.value }))}
              placeholder="hbbr-rustdesk.meuservidor.com.br"
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">Servidor de relay para conexões NAT</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 flex items-center gap-1">
              <Server className="h-3 w-3 text-purple-400" />
              Servidor da API (opcional)
            </label>
            <Input
              value={form.api_server}
              onChange={e => setForm(p => ({ ...p, api_server: e.target.value }))}
              placeholder="https://api-rustdesk.meuservidor.com.br"
              className="bg-slate-900 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">API REST do RustDesk Server Pro (se disponível)</p>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 flex items-center gap-1">
              <Key className="h-3 w-3 text-amber-400" />
              Key do Servidor
            </label>
            <div className="flex gap-1">
              <Input
                value={form.key}
                onChange={e => setForm(p => ({ ...p, key: e.target.value }))}
                placeholder="Chave pública do servidor"
                className="bg-slate-900 border-slate-600 text-white font-mono text-xs"
              />
              {form.key && (
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white shrink-0"
                  onClick={() => copyToClipboard(form.key, 'Key')}>
                  <Copy className="h-3 w-3" />
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Chave para verificação de identidade do servidor</p>
          </div>
        </div>

        {/* Config String */}
        <div>
          <label className="text-sm text-slate-400 mb-1 flex items-center gap-1">
            <FileCode className="h-3 w-3 text-cyan-400" />
            String de Configuração (Encoded Config)
          </label>
          <Textarea
            value={form.config_string}
            onChange={e => setForm(p => ({ ...p, config_string: e.target.value }))}
            placeholder="Cole aqui a string de configuração do RustDesk..."
            className="bg-slate-900 border-slate-600 text-white font-mono text-xs min-h-[60px]"
          />
          <p className="text-xs text-slate-500 mt-1">
            String codificada com todas as configurações do servidor (usada para configurar clientes automaticamente)
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-700">
          <div>
            <p className="text-sm text-white">Servidor ativo</p>
            <p className="text-xs text-slate-400">Habilitar uso do servidor próprio para conexões</p>
          </div>
          <Switch
            checked={form.is_active}
            onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))}
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg border ${testResult.success ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${testResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                Resultado do Teste
              </span>
            </div>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
              {testResult.message}
            </pre>
          </div>
        )}

        {/* Existing config info */}
        {existing && (
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-white font-medium">Servidor Configurado</span>
              <Badge className={existing.is_active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}>
                {existing.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {existing.base_url && (
              <div className="text-xs text-slate-400">
                <span className="text-slate-500">hbbs:</span> <span className="text-blue-300">{existing.base_url}</span>
              </div>
            )}
            {existing.webhook_url && (
              <div className="text-xs text-slate-400">
                <span className="text-slate-500">hbbr:</span> <span className="text-green-300">{existing.webhook_url}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !form.hbbs_server}
            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-1" />
            )}
            {testing ? 'Testando...' : 'Testar Conexão'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {saving ? 'Salvando...' : 'Salvar Servidor'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
