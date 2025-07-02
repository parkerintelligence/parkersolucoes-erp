
import { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Plus, Loader2, Building2, AlertTriangle, FileText, Users } from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPIDashboard } from '@/components/GLPIDashboard';
import { GLPITicketsGrid } from '@/components/GLPITicketsGrid';
import { GLPIInventory } from '@/components/GLPIInventory';
import { GLPIConnectionStatus } from '@/components/GLPIConnectionStatus';
import { GLPISidebar } from '@/components/glpi/GLPISidebar';
import { GLPIHeader } from '@/components/glpi/GLPIHeader';

const GLPI = () => {
  const { 
    glpiIntegration, 
    createTicket, 
    initSession,
    hasValidSession,
    tickets,
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
  const [activeTab, setActiveTab] = useState('dashboard');
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
      <div className="min-h-screen bg-glpi-background flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-glpi-border">
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-glpi-text-muted" />
            <h3 className="text-lg font-semibold mb-2 text-glpi-text">GLPI não configurado</h3>
            <p className="text-glpi-text-muted mb-4">
              Configure a integração com GLPI no painel administrativo para acessar todas as funcionalidades.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin'}
              className="bg-glpi-secondary hover:bg-glpi-secondary/90 text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRefresh = () => {
    tickets.refetch();
    problems.refetch();
    changes.refetch();
    suppliers.refetch();
    contracts.refetch();
    users.refetch();
    entities.refetch();
    locations.refetch();
    groups.refetch();
  };

  const isLoading = tickets.isLoading || problems.isLoading || changes.isLoading;

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full flex bg-glpi-background">
        <GLPISidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <SidebarInset className="flex-1">
          <GLPIHeader 
            activeTab={activeTab}
            onRefresh={handleRefresh}
            onCreateTicket={() => setIsCreatingTicket(true)}
            isLoading={isLoading}
          />

          <div className="p-6">
            {!hasValidSession && (
              <div className="mb-6">
                <Card className="border-glpi-warning/20 bg-glpi-warning/5">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-glpi-text font-medium">Sessão GLPI não iniciada</p>
                      <p className="text-glpi-text-muted text-sm">Inicie uma sessão para acessar os dados</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => initSession.mutate()}
                      className="border-glpi-warning text-glpi-warning hover:bg-glpi-warning/10"
                    >
                      Iniciar Sessão
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <Dialog open={isCreatingTicket} onOpenChange={setIsCreatingTicket}>
              <DialogTrigger asChild>
                <div></div>
              </DialogTrigger>
              <DialogContent className="bg-glpi-surface border-glpi-border">
                <DialogHeader>
                  <DialogTitle className="text-glpi-text">Criar Novo Chamado</DialogTitle>
                  <DialogDescription className="text-glpi-text-muted">
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
                      className="bg-glpi-secondary hover:bg-glpi-secondary/90 text-white"
                    >
                      {createTicket.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Criar Chamado
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreatingTicket(false)}
                      className="border-glpi-border hover:bg-glpi-surface-2"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Conteúdo dinâmico baseado na aba ativa */}
            <div className="space-y-6">
              {activeTab === 'dashboard' && <GLPIDashboard />}
              {activeTab === 'tickets' && <GLPITicketsGrid />}
              {activeTab === 'inventory' && <GLPIInventory />}
              {activeTab === 'itil' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Problemas */}
                  <Card className="border-glpi-border bg-glpi-surface">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-glpi-text mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-glpi-warning" />
                        Problemas ({problems.data?.length || 0})
                      </h3>
                      {problems.isLoading ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-glpi-text-muted" />
                          <p className="text-sm text-glpi-text-muted">Carregando problemas...</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {problems.data?.slice(0, 5).map((problem) => (
                            <div key={problem.id} className="p-3 bg-glpi-surface-2 rounded-lg border border-glpi-border">
                              <div className="font-medium text-sm text-glpi-text">#{problem.id} - {problem.name}</div>
                              <div className="text-xs text-glpi-text-muted truncate mt-1">{problem.content}</div>
                            </div>
                          )) || <p className="text-sm text-glpi-text-muted">Nenhum problema encontrado</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Mudanças */}
                  <Card className="border-glpi-border bg-glpi-surface">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-glpi-text mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-glpi-secondary" />
                        Mudanças ({changes.data?.length || 0})
                      </h3>
                      {changes.isLoading ? (
                        <div className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-glpi-text-muted" />
                          <p className="text-sm text-glpi-text-muted">Carregando mudanças...</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {changes.data?.slice(0, 5).map((change) => (
                            <div key={change.id} className="p-3 bg-glpi-surface-2 rounded-lg border border-glpi-border">
                              <div className="font-medium text-sm text-glpi-text">#{change.id} - {change.name}</div>
                              <div className="text-xs text-glpi-text-muted truncate mt-1">{change.content}</div>
                            </div>
                          )) || <p className="text-sm text-glpi-text-muted">Nenhuma mudança encontrada</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              {activeTab === 'organization' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Usuários */}
                  <Card className="border-glpi-border bg-glpi-surface">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-glpi-text mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-glpi-info" />
                        Usuários ({users.data?.length || 0})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {users.data?.slice(0, 10).map((user) => (
                          <div key={user.id} className="p-3 bg-glpi-surface-2 rounded-lg border border-glpi-border">
                            <div className="font-medium text-sm text-glpi-text">{user.realname} {user.firstname}</div>
                            <div className="text-xs text-glpi-text-muted">{user.email}</div>
                          </div>
                        )) || <p className="text-sm text-glpi-text-muted">Nenhum usuário encontrado</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Entidades */}
                  <Card className="border-glpi-border bg-glpi-surface">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-glpi-text mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-glpi-success" />
                        Entidades ({entities.data?.length || 0})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {entities.data?.slice(0, 10).map((entity) => (
                          <div key={entity.id} className="p-3 bg-glpi-surface-2 rounded-lg border border-glpi-border">
                            <div className="font-medium text-sm text-glpi-text">{entity.name}</div>
                            <div className="text-xs text-glpi-text-muted">{entity.comment}</div>
                          </div>
                        )) || <p className="text-sm text-glpi-text-muted">Nenhuma entidade encontrada</p>}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Localizações */}
                  <Card className="border-glpi-border bg-glpi-surface">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-glpi-text mb-4 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-glpi-secondary" />
                        Localizações ({locations.data?.length || 0})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {locations.data?.slice(0, 10).map((location) => (
                          <div key={location.id} className="p-3 bg-glpi-surface-2 rounded-lg border border-glpi-border">
                            <div className="font-medium text-sm text-glpi-text">{location.name}</div>
                            {location.address && <div className="text-xs text-glpi-text-muted">{location.address}</div>}
                          </div>
                        )) || <p className="text-sm text-glpi-text-muted">Nenhuma localização encontrada</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default GLPI;
