import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useIntegrations } from '@/hooks/useIntegrations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const formSchema = z.object({
  type: z.enum(['chatwoot', 'evolution_api', 'wasabi', 'grafana', 'bomcontrole', 'zabbix', 'ftp']),
  name: z.string().min(2, {
    message: "Nome precisa ter ao menos 2 caracteres.",
  }),
  base_url: z.string().url({ message: "URL inválida" }),
  api_token: z.string().optional(),
  webhook_url: z.string().url({ message: "URL inválida" }).optional().or(z.literal("")),
  phone_number: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  region: z.string().optional(),
  port: z.number().optional(),
  is_active: z.boolean().default(true),
})

const AdminApiPanel = () => {
  const [selectedType, setSelectedType] = useState<"chatwoot" | "evolution_api" | "wasabi" | "grafana" | "bomcontrole" | "zabbix" | "ftp">("chatwoot");
  const { createIntegration, updateIntegration, deleteIntegration, data: integrations, isLoading, isError } = useIntegrations();
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "chatwoot",
      name: "",
      base_url: "",
      api_token: "",
      webhook_url: "",
      phone_number: "",
      username: "",
      password: "",
      region: "",
      port: 21,
      is_active: true,
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log('Dados do formulário:', values);
    
    // Ensure all required fields are present with proper defaults
    const integrationData = {
      type: values.type,
      name: values.name,
      base_url: values.base_url,
      api_token: values.api_token || null,
      webhook_url: values.webhook_url || null,
      phone_number: values.phone_number || null,
      username: values.username || null,
      password: values.password || null,
      region: values.region || null,
      bucket_name: null, // Removido do formulário, sempre null
      port: values.port || null,
      is_active: values.is_active,
    };

    console.log('Dados para enviar:', integrationData);

    if (editingIntegrationId) {
      updateIntegration.mutate({ id: editingIntegrationId, updates: integrationData });
      setEditingIntegrationId(null);
    } else {
      createIntegration.mutate(integrationData);
    }
    form.reset();
  }

  const handleEditIntegration = (integration: any) => {
    console.log('Editando integração:', integration);
    setEditingIntegrationId(integration.id);
    form.setValue("type", integration.type);
    form.setValue("name", integration.name);
    form.setValue("base_url", integration.base_url);
    form.setValue("api_token", integration.api_token || "");
    form.setValue("webhook_url", integration.webhook_url || "");
    form.setValue("phone_number", integration.phone_number || "");
    form.setValue("username", integration.username || "");
    form.setValue("password", integration.password || "");
    form.setValue("region", integration.region || "");
    form.setValue("port", integration.port || 21);
    form.setValue("is_active", integration.is_active !== null ? integration.is_active : true);
    setSelectedType(integration.type);
  };

  const handleDeleteIntegration = (id: string) => {
    if (confirm("Tem certeza que deseja remover essa integração?")) {
      deleteIntegration.mutate(id);
    }
  };

  const getFieldsForType = (type: string) => {
    switch (type) {
      case "chatwoot":
        return getChatwootFields();
      case "evolution_api":
        return getEvolutionApiFields();
      case "wasabi":
        return getWasabiFields();
      case "grafana":
        return getGrafanaFields();
      case "bomcontrole":
        return getBomControleFields();
      case "zabbix":
        return getZabbixFields();
      case "ftp":
        return getFtpFields();
      default:
        return null;
    }
  };

  const getChatwootFields = () => (
    <>
      <FormField
        control={form.control}
        name="api_token"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Token *</FormLabel>
            <FormControl>
              <Input placeholder="Chave da API" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="webhook_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Webhook URL</FormLabel>
            <FormControl>
              <Input placeholder="URL do Webhook" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const getEvolutionApiFields = () => (
    <>
      <FormField
        control={form.control}
        name="phone_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número de Telefone *</FormLabel>
            <FormControl>
              <Input placeholder="554199999999" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="api_token"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Token *</FormLabel>
            <FormControl>
              <Input placeholder="Chave da API" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const getWasabiFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Região</FormLabel>
              <FormControl>
                <Input 
                  placeholder="us-east-1" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Key *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Sua chave de acesso" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Secret Key *</FormLabel>
              <FormControl>
                <Input 
                  type="password"
                  placeholder="Sua chave secreta" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );

  const getGrafanaFields = () => (
    <>
      <FormField
        control={form.control}
        name="api_token"
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Token *</FormLabel>
            <FormControl>
              <Input placeholder="Chave da API" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const getBomControleFields = () => (
    <>
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Usuário *</FormLabel>
            <FormControl>
              <Input placeholder="Usuário" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Senha *</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Senha" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const getZabbixFields = () => (
    <>
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Usuário *</FormLabel>
            <FormControl>
              <Input placeholder="Usuário" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Senha *</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Senha" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const getFtpFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuário FTP *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="usuario_ftp" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha FTP *</FormLabel>
              <FormControl>
                <Input 
                  type="password"
                  placeholder="Senha do FTP" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="port"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Porta FTP</FormLabel>
            <FormControl>
              <Input 
                type="number"
                placeholder="21" 
                {...field}
                value={field.value || 21}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Painel de Integrações</CardTitle>
          <CardDescription>
            Adicione e configure integrações com diferentes serviços.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as typeof selectedType)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="chatwoot">Chatwoot</TabsTrigger>
              <TabsTrigger value="evolution_api">Evolution API</TabsTrigger>
              <TabsTrigger value="wasabi">Wasabi</TabsTrigger>
              <TabsTrigger value="grafana">Grafana</TabsTrigger>
              <TabsTrigger value="bomcontrole">BomControle</TabsTrigger>
              <TabsTrigger value="zabbix">Zabbix</TabsTrigger>
              <TabsTrigger value="ftp">FTP</TabsTrigger>
            </TabsList>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Integração</FormLabel>
                      <Select onValueChange={(value) => {
                        const newType = value as "chatwoot" | "evolution_api" | "wasabi" | "grafana" | "bomcontrole" | "zabbix" | "ftp";
                        form.setValue("type", newType);
                        setSelectedType(newType);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="chatwoot">Chatwoot</SelectItem>
                          <SelectItem value="evolution_api">Evolution API</SelectItem>
                          <SelectItem value="wasabi">Wasabi</SelectItem>
                          <SelectItem value="grafana">Grafana</SelectItem>
                          <SelectItem value="bomcontrole">BomControle</SelectItem>
                          <SelectItem value="zabbix">Zabbix</SelectItem>
                          <SelectItem value="ftp">FTP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da integração" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="base_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Base *</FormLabel>
                      <FormControl>
                        <Input placeholder="https://api.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {getFieldsForType(selectedType)}

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Ativo</FormLabel>
                        <FormDescription>
                          Define se a integração está ativa e disponível para uso.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createIntegration.isPending || updateIntegration.isPending}>
                  {editingIntegrationId ? 
                    (updateIntegration.isPending ? "Atualizando..." : "Atualizar Integração") : 
                    (createIntegration.isPending ? "Criando..." : "Criar Integração")
                  }
                </Button>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>

      {/* List of Integrations */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Lista de Integrações</h2>
        {isError && <p className="text-red-500">Ocorreu um erro ao carregar as integrações.</p>}
        {isLoading ? (
          <p>Carregando integrações...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations?.map((integration) => (
              <Card key={integration.id} className="bg-gray-50 border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{integration.name}</CardTitle>
                  <CardDescription>Tipo: {integration.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">URL: {integration.base_url}</p>
                  {integration.type === 'evolution_api' && integration.phone_number && (
                    <p className="text-sm text-gray-600 mb-2">Telefone: {integration.phone_number}</p>
                  )}
                  {integration.type === 'ftp' && integration.port && (
                    <p className="text-sm text-gray-600 mb-2">Porta: {integration.port}</p>
                  )}
                  <p className="text-sm text-gray-600 mb-4">
                    Status: {integration.is_active ? 
                      <span className="text-green-600 font-medium">Ativo</span> : 
                      <span className="text-red-600 font-medium">Inativo</span>
                    }
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" size="sm" onClick={() => handleEditIntegration(integration)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteIntegration(integration.id)}>
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApiPanel;
