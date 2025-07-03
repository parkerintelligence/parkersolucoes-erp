import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Headphones, Settings, RefreshCw, Plus, Loader2, BarChart3, AlertTriangle, HardDrive, FileText, Users, Building2, Crown } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('tickets');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
        <Card className="border-amber-400/30 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <h3 className="text-xl font-semibold mb-2 text-white">GLPI não configurado</h3>
            <p className="text-slate-300 mb-4">
              Configure a integração com GLPI no painel administrativo para acessar todas as funcionalidades.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin'} 
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
            >
              <Settings className="mr-2 h-4 w-4" />
              Ir para Configurações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      {/* Header Principal */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <Headphones className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Sistema GLPI</h1>
              <p className="text-slate-300">Central de Gestão de TI</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!hasValidSession && (
              <Button 
                variant="outline" 
                onClick={() => initSession.mutate()}
                className="border-amber-400/50 text-amber-400 hover:bg-amber-400/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Iniciar Sessão
              </Button>
            )}
            
            <Button 
              onClick={() => setActiveTab('dashboard')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
            >
              <Crown className="mr-2 h-4 w-4" />
              Resumo Executivo
            </Button>
            
            <Dialog open={isCreatingTicket} onOpenChange={setIsCreatingTicket}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Chamado
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-amber-400/30">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Novo Chamado</DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Preencha os dados para criar um novo chamado no GLPI
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ticket-name" className="text-white">Título do Chamado</Label>
                    <Input
                      id="ticket-name"
                      value={newTicket.name}
                      onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                      placeholder="Descreva brevemente o problema"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket-content" className="text-white">Descrição</Label>
                    <Textarea
                      id="ticket-content"
                      value={newTicket.content}
                      onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
                      placeholder="Descreva detalhadamente o problema"
                      rows={4}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateTicket} 
                      disabled={createTicket.isPending || !newTicket.name || !newTicket.content}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900"
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
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
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

        {/* Navegação por Abas */}
        <div className="flex gap-2 mt-6">
          <Button 
            variant={activeTab === 'tickets' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tickets')}
            className={activeTab === 'tickets' 
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold' 
              : 'border-amber-400/50 text-amber-400 hover:bg-amber-400/10'
            }
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Central de Chamados
          </Button>
          <Button 
            variant={activeTab === 'inventory' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inventory')}
            className={activeTab === 'inventory' 
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold' 
              : 'border-amber-400/50 text-amber-400 hover:bg-amber-400/10'
            }
          >
            <HardDrive className="mr-2 h-4 w-4" />
            Inventário
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <GLPIDashboard />}
        {activeTab === 'tickets' && <GLPITicketsGrid />}
        {activeTab === 'inventory' && <GLPIInventory />}
      </div>
    </div>
  );
};

export default GLPI;