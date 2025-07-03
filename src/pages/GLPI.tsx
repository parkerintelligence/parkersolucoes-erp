import { useState } from 'react';
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
      <div className="space-y-6">
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
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
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateTicket} 
                  disabled={createTicket.isPending || !newTicket.name || !newTicket.content}
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

      {/* Status da Conexão */}
      <GLPIConnectionStatus />

      {/* Interface Principal */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Button 
          variant={activeTab === 'dashboard' ? 'default' : 'outline'}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </Button>
        <Button 
          variant={activeTab === 'tickets' ? 'default' : 'outline'}
          onClick={() => setActiveTab('tickets')}
        >
          Chamados
        </Button>
        <Button 
          variant={activeTab === 'inventory' ? 'default' : 'outline'}
          onClick={() => setActiveTab('inventory')}
        >
          Inventário
        </Button>
      </div>

      {/* Conteúdo dinâmico baseado na aba ativa */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <GLPIDashboard />}
        {activeTab === 'tickets' && <GLPITicketsGrid />}
        {activeTab === 'inventory' && <GLPIInventory />}
      </div>
    </div>
  );
};

export default GLPI;