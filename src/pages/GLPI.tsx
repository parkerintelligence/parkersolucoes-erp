
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Headphones, Settings, RefreshCw, Plus, Loader2, BarChart3 } from 'lucide-react';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { GLPITicketsGrid } from '@/components/GLPITicketsGrid';
import { GLPIInventory } from '@/components/GLPIInventory';
import { GLPIConnectionStatus } from '@/components/GLPIConnectionStatus';
import { GLPITicketMetrics } from '@/components/glpi/GLPITicketMetrics';

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
  const [activeTab, setActiveTab] = useState('tickets');
  const [showSummary, setShowSummary] = useState(false);
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
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2 text-white">GLPI não configurado</h3>
              <p className="text-gray-400 mb-4">
                Configure a integração com GLPI no painel administrativo para acessar todas as funcionalidades.
              </p>
              <Button onClick={() => window.location.href = '/admin'} className="bg-blue-600 hover:bg-blue-700">
                <Settings className="mr-2 h-4 w-4" />
                Ir para Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {!hasValidSession && (
              <Button variant="outline" onClick={() => initSession.mutate()} className="border-gray-600 text-gray-200 hover:bg-gray-800">
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
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Novo Chamado</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Preencha os dados para criar um novo chamado no GLPI
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ticket-name" className="text-gray-200">Título do Chamado</Label>
                    <Input
                      id="ticket-name"
                      value={newTicket.name}
                      onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                      placeholder="Descreva brevemente o problema"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket-content" className="text-gray-200">Descrição</Label>
                    <Textarea
                      id="ticket-content"
                      value={newTicket.content}
                      onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
                      placeholder="Descreva detalhadamente o problema"
                      rows={4}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateTicket} 
                      disabled={createTicket.isPending || !newTicket.name || !newTicket.content}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createTicket.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Criar Chamado
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreatingTicket(false)} className="border-gray-600 text-gray-200 hover:bg-gray-800">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Botão de Resumo no canto superior direito */}
          <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="bg-yellow-900/20 border-yellow-600 text-yellow-400 hover:bg-yellow-900/30">
                <BarChart3 className="mr-2 h-4 w-4" />
                Resumo Executivo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">📊 Resumo Executivo GLPI</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Visão geral das métricas e indicadores principais
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6">
                <GLPITicketMetrics tickets={tickets.data || []} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Status da Conexão */}
        <GLPIConnectionStatus />

        {/* Interface Principal - Apenas Chamados e Inventário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button 
            variant={activeTab === 'tickets' ? 'default' : 'outline'}
            onClick={() => setActiveTab('tickets')}
            className={`h-12 ${activeTab === 'tickets' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-200 hover:bg-gray-800'}`}
          >
            📞 Central de Chamados
          </Button>
          <Button 
            variant={activeTab === 'inventory' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inventory')}
            className={`h-12 ${activeTab === 'inventory' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-200 hover:bg-gray-800'}`}
          >
            💻 Inventário de Ativos
          </Button>
        </div>

        {/* Conteúdo dinâmico baseado na aba ativa */}
        <div className="mt-6">
          {activeTab === 'tickets' && <GLPITicketsGrid />}
          {activeTab === 'inventory' && <GLPIInventory />}
        </div>
      </div>
    </div>
  );
};

export default GLPI;
