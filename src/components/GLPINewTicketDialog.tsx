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
    requestType: String(defaultParams.type || 1)
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
        requestType: String(params.type || 1)
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
      };

      console.log('🎫 [GLPINewTicketDialog] Dados preparados para envio:', ticketData);
      console.log('🎫 [GLPINewTicketDialog] Parâmetros padrão aplicados:', defaultParams);
      console.log('🎫 [GLPINewTicketDialog] Mutation status:', {
        isPending: createTicket.isPending,
        isError: createTicket.isError,
        error: createTicket.error
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
        requestType: String(defaultParams.type || 1)
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
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Novo Chamado GLPI</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Descreva brevemente o problema"
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="content" className="text-gray-300">Descrição</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Descreva detalhadamente o problema ou solicitação"
              className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="text-gray-300">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="1" className="text-white">Muito Baixa</SelectItem>
                  <SelectItem value="2" className="text-white">Baixa</SelectItem>
                  <SelectItem value="3" className="text-white">Média</SelectItem>
                  <SelectItem value="4" className="text-white">Alta</SelectItem>
                  <SelectItem value="5" className="text-white">Muito Alta</SelectItem>
                  <SelectItem value="6" className="text-white">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency" className="text-gray-300">Urgência</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="1" className="text-white">Muito Baixa</SelectItem>
                  <SelectItem value="2" className="text-white">Baixa</SelectItem>
                  <SelectItem value="3" className="text-white">Média</SelectItem>
                  <SelectItem value="4" className="text-white">Alta</SelectItem>
                  <SelectItem value="5" className="text-white">Muito Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="impact" className="text-gray-300">Impacto</Label>
              <Select value={formData.impact} onValueChange={(value) => setFormData({ ...formData, impact: value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="1" className="text-white">Muito Baixo</SelectItem>
                  <SelectItem value="2" className="text-white">Baixo</SelectItem>
                  <SelectItem value="3" className="text-white">Médio</SelectItem>
                  <SelectItem value="4" className="text-white">Alto</SelectItem>
                  <SelectItem value="5" className="text-white">Muito Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="requestType" className="text-gray-300">Tipo de Solicitação</Label>
              <Select value={formData.requestType} onValueChange={(value) => setFormData({ ...formData, requestType: value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="1" className="text-white">Incidente</SelectItem>
                  <SelectItem value="2" className="text-white">Solicitação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category" className="text-gray-300">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {itilCategories.data?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()} className="text-white">
                    {category.name}
                  </SelectItem>
                ))}
                {(!itilCategories.data || itilCategories.data.length === 0) && (
                  <SelectItem value="1" className="text-white">Geral</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTicket.isPending || !formData.title.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {createTicket.isPending ? 'Criando...' : 'Criar Chamado'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
