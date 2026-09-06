import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface GLPINewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GLPINewTicketDialog = ({
  open,
  onOpenChange
}: GLPINewTicketDialogProps) => {
  const { createTicket, entities, users, itilCategories, requestTypes } = useGLPIExpanded();
  const { data: settings } = useSystemSettings('glpi');
  
  // Buscar parâmetros padrão configurados
  const glpiTicketParams = settings?.find(s => s.setting_key === 'glpi_default_ticket_params');
  const defaultParams = glpiTicketParams?.setting_value 
    ? JSON.parse(glpiTicketParams.setting_value)
    : {
        priority: 3,
        urgency: 3,
        impact: 3,
        type: 1,
        requesttypes_id: 1
      };
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: String(defaultParams.priority || 3),
    urgency: String(defaultParams.urgency || 3),
    impact: String(defaultParams.impact || 3),
    category: String(defaultParams.itilcategories_id || ''),
    requestType: String(defaultParams.type || 1),
    entity: String(defaultParams.entities_id || ''),
    assignedUser: String(defaultParams.users_id_assign || 'none'),
  });

  // Atualizar valores padrão quando os parâmetros mudarem
  useEffect(() => {
    if (glpiTicketParams?.setting_value) {
      const params = JSON.parse(glpiTicketParams.setting_value);
      setFormData(prev => ({
        ...prev,
        priority: String(params.priority || 3),
        urgency: String(params.urgency || 3),
        impact: String(params.impact || 3),
        category: String(params.itilcategories_id || ''),
        requestType: String(params.type || 1),
        entity: String(params.entities_id || ''),
        assignedUser: String(params.users_id_assign || 'none'),
      }));
    }
  }, [glpiTicketParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎫 [GLPINewTicketDialog] Iniciando criação de chamado');
    console.log('🎫 [GLPINewTicketDialog] Form data:', formData);
    
    if (!formData.title.trim()) {
      console.warn('🎫 [GLPINewTicketDialog] Título vazio - cancelando criação');
      toast({
        title: "Erro",
        description: "O título do chamado é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.entity) {
      console.warn('🎫 [GLPINewTicketDialog] Entidade não selecionada - cancelando criação');
      toast({
        title: "Erro",
        description: "Selecione uma entidade para o chamado.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mesclar dados do formulário com parâmetros padrão configurados
      const ticketData = {
        ...defaultParams, // Parâmetros base configurados
        name: formData.title, // Override com dados do formulário
        content: formData.content,
        priority: parseInt(formData.priority),
        urgency: parseInt(formData.urgency),
        impact: parseInt(formData.impact),
        type: parseInt(formData.requestType),
        itilcategories_id: formData.category ? parseInt(formData.category) : defaultParams.itilcategories_id,
        entities_id: formData.entity ? parseInt(formData.entity) : defaultParams.entities_id,
        users_id_assign: formData.assignedUser && formData.assignedUser !== 'none' ? parseInt(formData.assignedUser) : undefined,
      };

      console.log('🎫 [GLPINewTicketDialog] Dados completos preparados:', {
        title: ticketData.name,
        content: ticketData.content,
        'content.length': ticketData.content?.length || 0,
        entity: ticketData.entities_id,
        assignedUser: ticketData.users_id_assign,
        category: ticketData.itilcategories_id,
        priority: ticketData.priority,
        urgency: ticketData.urgency,
        impact: ticketData.impact,
        type: ticketData.type,
        defaultParams,
      });

      const result = await createTicket.mutateAsync(ticketData);
      console.log('🎫 [GLPINewTicketDialog] Resultado da criação:', result);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        priority: String(defaultParams.priority || 3),
        urgency: String(defaultParams.urgency || 3),
        impact: String(defaultParams.impact || 3),
        category: String(defaultParams.itilcategories_id || ''),
        requestType: String(defaultParams.type || 1),
        entity: String(defaultParams.entities_id || ''),
        assignedUser: String(defaultParams.users_id_assign || ''),
      });
      
      console.log('🎫 [GLPINewTicketDialog] Formulário resetado e dialog fechando');
      onOpenChange(false);
    } catch (error) {
      console.error('🎫 [GLPINewTicketDialog] Erro ao criar chamado:', error);
      // Erro será tratado pelo hook, mas vamos adicionar uma mensagem de fallback
      if (!createTicket.isError) {
        toast({
          title: "Erro inesperado",
          description: "Não foi possível criar o chamado. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Chamado GLPI</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Informações Básicas */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Informações Básicas</h3>
            </div>
            
            <div>
              <Label htmlFor="title" className="text-muted-foreground">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Descreva brevemente o problema"
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-muted-foreground">Descrição</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Descreva detalhadamente o problema ou solicitação"
                className="bg-secondary border-border text-foreground min-h-[100px]"
              />
            </div>
          </div>

          {/* Seção 2: Atribuições */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Atribuições</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entity" className="text-muted-foreground">Entidade *</Label>
                <Select 
                  value={formData.entity} 
                  onValueChange={(value) => setFormData({ ...formData, entity: value })}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione uma entidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    {entities.data?.map((entity: any) => (
                      <SelectItem key={entity.id} value={entity.id.toString()} className="text-foreground">
                        {entity.completename || entity.name || `Entidade ${entity.id}`}
                      </SelectItem>
                    ))}
                    {(!entities.data || entities.data.length === 0) && (
                      <SelectItem value="0" className="text-foreground">Entidade Raiz</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignedUser" className="text-muted-foreground">Técnico Responsável</Label>
                <Select 
                  value={formData.assignedUser} 
                  onValueChange={(value) => setFormData({ ...formData, assignedUser: value })}
                >
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Atribuir depois" />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    <SelectItem value="none" className="text-foreground">Nenhum (atribuir depois)</SelectItem>
                    {users.data
                      ?.filter((user: any) => user.is_active === 1 || user.is_active === true)
                      ?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()} className="text-foreground">
                          {user.realname || user.name || `Usuário ${user.id}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção 3: Classificação */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Classificação</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-muted-foreground">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    {itilCategories.data?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()} className="text-foreground">
                        {category.completename || category.name}
                      </SelectItem>
                    ))}
                    {(!itilCategories.data || itilCategories.data.length === 0) && (
                      <SelectItem value="1" className="text-foreground">Geral</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requestType" className="text-muted-foreground">Tipo de Solicitação</Label>
                <Select value={formData.requestType} onValueChange={(value) => setFormData({ ...formData, requestType: value })}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    <SelectItem value="1" className="text-foreground">Incidente</SelectItem>
                    <SelectItem value="2" className="text-foreground">Solicitação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção 4: Priorização */}
          <div className="space-y-4">
            <div className="border-b border-border pb-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Priorização</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priority" className="text-muted-foreground">Prioridade</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    <SelectItem value="1" className="text-foreground">Muito Baixa</SelectItem>
                    <SelectItem value="2" className="text-foreground">Baixa</SelectItem>
                    <SelectItem value="3" className="text-foreground">Média</SelectItem>
                    <SelectItem value="4" className="text-foreground">Alta</SelectItem>
                    <SelectItem value="5" className="text-foreground">Muito Alta</SelectItem>
                    <SelectItem value="6" className="text-foreground">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency" className="text-muted-foreground">Urgência</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    <SelectItem value="1" className="text-foreground">Muito Baixa</SelectItem>
                    <SelectItem value="2" className="text-foreground">Baixa</SelectItem>
                    <SelectItem value="3" className="text-foreground">Média</SelectItem>
                    <SelectItem value="4" className="text-foreground">Alta</SelectItem>
                    <SelectItem value="5" className="text-foreground">Muito Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="impact" className="text-muted-foreground">Impacto</Label>
                <Select value={formData.impact} onValueChange={(value) => setFormData({ ...formData, impact: value })}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border-border">
                    <SelectItem value="1" className="text-foreground">Muito Baixo</SelectItem>
                    <SelectItem value="2" className="text-foreground">Baixo</SelectItem>
                    <SelectItem value="3" className="text-foreground">Médio</SelectItem>
                    <SelectItem value="4" className="text-foreground">Alto</SelectItem>
                    <SelectItem value="5" className="text-foreground">Muito Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-muted-foreground hover:bg-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTicket.isPending || !formData.title.trim() || !formData.entity}
              className="bg-blue-600 hover:bg-blue-700 text-foreground"
            >
              {createTicket.isPending ? 'Criando...' : 'Criar Chamado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
