
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, Plus, Smartphone, Settings, Play, Pause, BarChart3 } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

const WhatsApp = () => {
  const { data: integrations = [], createIntegration } = useIntegrations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'chatwoot' as 'chatwoot' | 'evolution_api',
    name: '',
    base_url: '',
    api_token: '',
    webhook_url: '',
    phone_number: ''
  });

  const whatsappIntegrations = integrations.filter(integration => 
    integration.type === 'chatwoot' || integration.type === 'evolution_api'
  );

  const handleSave = () => {
    if (!formData.name || !formData.base_url || !formData.api_token) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    createIntegration.mutate({
      is_active: true,
      type: formData.type,
      name: formData.name,
      base_url: formData.base_url,
      api_token: formData.api_token,
      webhook_url: formData.webhook_url,
      phone_number: formData.phone_number,
      username: null,
      password: null,
      region: null,
      bucket_name: null,
      port: null,
      directory: null,
      passive_mode: null,
      use_ssl: null,
      keep_logged: null
    });

    setFormData({
      type: 'chatwoot',
      name: '',
      base_url: '',
      api_token: '',
      webhook_url: '',
      phone_number: ''
    });
    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Integração
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Integração WhatsApp</DialogTitle>
                <DialogDescription>
                  Configure uma nova integração com Chatwoot ou Evolution API
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo de Integração</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chatwoot">Chatwoot</SelectItem>
                      <SelectItem value="evolution_api">Evolution API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Integração</Label>
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: WhatsApp Principal" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="base_url">URL da API</Label>
                  <Input 
                    id="base_url" 
                    value={formData.base_url}
                    onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                    placeholder="https://api.exemplo.com" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="api_token">Token da API</Label>
                  <Input 
                    id="api_token" 
                    type="password"
                    value={formData.api_token}
                    onChange={(e) => setFormData({...formData, api_token: e.target.value})}
                    placeholder="Token de acesso" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone_number">Número do WhatsApp</Label>
                  <Input 
                    id="phone_number" 
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="+5511999999999" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="webhook_url">URL do Webhook (opcional)</Label>
                  <Input 
                    id="webhook_url" 
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({...formData, webhook_url: e.target.value})}
                    placeholder="https://webhook.exemplo.com" 
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Integrações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {whatsappIntegrations.map((integration) => (
            <Card key={integration.id} className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  {integration.name}
                </CardTitle>
                <CardDescription>
                  {integration.type === 'chatwoot' ? 'Chatwoot' : 'Evolution API'} - {integration.phone_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${integration.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm">{integration.is_active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-green-600">
                      {integration.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {whatsappIntegrations.length === 0 && (
            <Card className="border-gray-200 md:col-span-2">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 mb-4">Nenhuma integração WhatsApp configurada ainda.</p>
                <p className="text-sm text-gray-400">Configure uma integração para começar a usar o WhatsApp Business.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Estatísticas */}
        {whatsappIntegrations.length > 0 && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-sm text-slate-600">Mensagens Hoje</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">0</p>
                  <p className="text-sm text-slate-600">Conversas Ativas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-slate-600">Contatos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">0</p>
                  <p className="text-sm text-slate-600">Mensagens Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default WhatsApp;
