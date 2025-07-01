
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Headphones, Settings, RefreshCw, Plus, Loader2, BarChart3, AlertTriangle, HardDrive, FileText, Users, Building2 } from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPIDashboard } from '@/components/GLPIDashboard';
import { GLPITicketsGrid } from '@/components/GLPITicketsGrid';
import { GLPIInventory } from '@/components/GLPIInventory';
import { GLPIConnectionStatus } from '@/components/GLPIConnectionStatus';

const GLPI = () => {
  const { 
    glpiIntegration, 
    createTicket, 
    initSession,
    hasValidSession,
    problems,
    changes,
    suppliers,
    contracts,
    users,
    entities,
    locations,
    groups
  } = useGLPIExpanded();

  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    name: '',
    content: '',
    priority: 3,
    urgency: 3,
    impact: 3,
    type: 1,
    entities_id: 0,
  });

  const handleCreateTicket = async () => {
    if (!newTicket.name || !newTicket.content || !newTicket.entities_id) return;
    
    try {
      await createTicket.mutateAsync(newTicket);
      setNewTicket({
        name: '',
        content: '',
        priority: 3,
        urgency: 3,
        impact: 3,
        type: 1,
        entities_id: 0,
      });
      setIsCreatingTicket(false);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  if (!glpiIntegration) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
                <Headphones className="h-8 w-8" />
                GLPI - Sistema Completo de Gestão
              </h1>
              <p className="text-blue-600">Plataforma integrada para gestão de TI</p>
            </div>
          </div>

          <Card className="border-blue-200">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">GLPI não configurado</h3>
              <p className="text-gray-600 mb-4">
                Configure a integração com GLPI no painel administrativo para acessar todas as funcionalidades.
              </p>
              <Button onClick={() => window.location.href = '/admin'}>
                <Settings className="mr-2 h-4 w-4" />
                Ir para Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Headphones className="h-8 w-8" />
              GLPI - Sistema Completo de Gestão
            </h1>
            <p className="text-blue-600">Gestão integrada de TI - Chamados, Ativos, Inventário e muito mais</p>
          </div>
          <div className="flex gap-2">
            {!hasValidSession && (
              <Button variant="outline" onClick={() => initSession.mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Iniciar Sessão
              </Button>
            )}
            <Dialog open={isCreatingTicket} onOpenChange={setIsCreatingTicket}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Chamado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Chamado</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar um novo chamado no GLPI
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ticket-name">Título do Chamado</Label>
                    <Input
                      id="ticket-name"
                      value={newTicket.name}
                      onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                      placeholder="Descreva brevemente o problema"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket-content">Descrição</Label>
                    <Textarea
                      id="ticket-content"
                      value={newTicket.content}
                      onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
                      placeholder="Descreva detalhadamente o problema"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket-entity">Entidade</Label>
                    <Select 
                      value={newTicket.entities_id.toString()} 
                      onValueChange={(value) => setNewTicket({ ...newTicket, entities_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma entidade">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {newTicket.entities_id > 0 
                              ? entities.data?.find(e => e.id === newTicket.entities_id)?.name 
                              : "Selecione uma entidade"
                            }
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {entities.data?.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {entity.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={newTicket.priority.toString()} onValueChange={(value) => setNewTicket({ ...newTicket, priority: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Muito Baixa</SelectItem>
                          <SelectItem value="2">Baixa</SelectItem>
                          <SelectItem value="3">Média</SelectItem>
                          <SelectItem value="4">Alta</SelectItem>
                          <SelectItem value="5">Muito Alta</SelectItem>
                          <SelectItem value="6">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgência</Label>
                      <Select value={newTicket.urgency.toString()} onValueChange={(value) => setNewTicket({ ...newTicket, urgency: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Muito Baixa</SelectItem>
                          <SelectItem value="2">Baixa</SelectItem>
                          <SelectItem value="3">Média</SelectItem>
                          <SelectItem value="4">Alta</SelectItem>
                          <SelectItem value="5">Muito Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="impact">Impacto</Label>
                      <Select value={newTicket.impact.toString()} onValueChange={(value) => setNewTicket({ ...newTicket, impact: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Muito Baixo</SelectItem>
                          <SelectItem value="2">Baixo</SelectItem>
                          <SelectItem value="3">Médio</SelectItem>
                          <SelectItem value="4">Alto</SelectItem>
                          <SelectItem value="5">Muito Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateTicket} 
                      disabled={createTicket.isPending || !newTicket.name || !newTicket.content || !newTicket.entities_id}
                    >
                      {createTicket.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Criar Chamado
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreatingTicket(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status da Conexão */}
        <GLPIConnectionStatus />

        {/* Interface Principal com Abas */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Chamados
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Inventário
            </TabsTrigger>
            <TabsTrigger value="itil" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              ITIL
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Organização
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gestão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <GLPIDashboard />
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            <GLPITicketsGrid />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <GLPIInventory />
          </TabsContent>

          <TabsContent value="itil" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Problemas */}
              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Problemas ({problems.data?.length || 0})
                  </h3>
                  {problems.isLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Carregando problemas...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {problems.data?.slice(0, 5).map((problem) => (
                        <div key={problem.id} className="p-2 bg-orange-50 rounded border border-orange-200">
                          <div className="font-medium text-sm">#{problem.id} - {problem.name}</div>
                          <div className="text-xs text-gray-600 truncate">{problem.content}</div>
                        </div>
                      )) || <p className="text-sm text-gray-500">Nenhum problema encontrado</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mudanças */}
              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Mudanças ({changes.data?.length || 0})
                  </h3>
                  {changes.isLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Carregando mudanças...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {changes.data?.slice(0, 5).map((change) => (
                        <div key={change.id} className="p-2 bg-purple-50 rounded border border-purple-200">
                          <div className="font-medium text-sm">#{change.id} - {change.name}</div>
                          <div className="text-xs text-gray-600 truncate">{change.content}</div>
                        </div>
                      )) || <p className="text-sm text-gray-500">Nenhuma mudança encontrada</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="organization" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Usuários */}
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuários ({users.data?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users.data?.slice(0, 10).map((user) => (
                      <div key={user.id} className="p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="font-medium text-sm">{user.realname} {user.firstname}</div>
                        <div className="text-xs text-gray-600">{user.email}</div>
                      </div>
                    )) || <p className="text-sm text-gray-500">Nenhum usuário encontrado</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Entidades */}
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Entidades ({entities.data?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {entities.data?.slice(0, 10).map((entity) => (
                      <div key={entity.id} className="p-2 bg-green-50 rounded border border-green-200">
                        <div className="font-medium text-sm">{entity.name}</div>
                        <div className="text-xs text-gray-600">{entity.comment}</div>
                      </div>
                    )) || <p className="text-sm text-gray-500">Nenhuma entidade encontrada</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Localizações */}
              <Card className="border-teal-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-teal-900 mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Localizações ({locations.data?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {locations.data?.slice(0, 10).map((location) => (
                      <div key={location.id} className="p-2 bg-teal-50 rounded border border-teal-200">
                        <div className="font-medium text-sm">{location.name}</div>
                        {location.address && <div className="text-xs text-gray-600">{location.address}</div>}
                      </div>
                    )) || <p className="text-sm text-gray-500">Nenhuma localização encontrada</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fornecedores */}
              <Card className="border-emerald-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Fornecedores ({suppliers.data?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {suppliers.data?.slice(0, 10).map((supplier) => (
                      <div key={supplier.id} className="p-2 bg-emerald-50 rounded border border-emerald-200">
                        <div className="font-medium text-sm">{supplier.name}</div>
                        <div className="text-xs text-gray-600">{supplier.email || supplier.website}</div>
                      </div>
                    )) || <p className="text-sm text-gray-500">Nenhum fornecedor encontrado</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Contratos */}
              <Card className="border-rose-200">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-rose-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contratos ({contracts.data?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {contracts.data?.slice(0, 10).map((contract) => (
                      <div key={contract.id} className="p-2 bg-rose-50 rounded border border-rose-200">
                        <div className="font-medium text-sm">{contract.name}</div>
                        <div className="text-xs text-gray-600">Número: {contract.num}</div>
                      </div>
                    )) || <p className="text-sm text-gray-500">Nenhum contrato encontrado</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default GLPI;
