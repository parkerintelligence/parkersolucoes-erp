
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';

interface GLPINewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GLPINewTicketDialog = ({
  open,
  onOpenChange
}: GLPINewTicketDialogProps) => {
  const { createTicket } = useGLPIExpanded();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: '3',
    urgency: '3',
    impact: '3',
    category: '',
    requestType: '1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título do chamado é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar dados do chamado conforme formato GLPI
      const ticketData = {
        name: formData.title,
        content: formData.content,
        priority: parseInt(formData.priority),
        urgency: parseInt(formData.urgency),
        impact: parseInt(formData.impact),
        type: parseInt(formData.requestType),
        entities_id: 0, // Entidade padrão
        status: 1, // Status: Novo
        // Campos obrigatórios adicionais para GLPI
        requesttypes_id: parseInt(formData.requestType),
        users_id_requester: 2, // ID padrão do usuário solicitante (ajustar conforme necessário)
        itilcategories_id: formData.category ? parseInt(formData.category) : 1, // Categoria padrão se não especificada
      };

      await createTicket.mutateAsync(ticketData);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        priority: '3',
        urgency: '3',
        impact: '3',
        category: '',
        requestType: '1'
      });
      
      onOpenChange(false);
    } catch (error) {
      // Erro será tratado pelo hook
      console.error('Erro ao criar chamado:', error);
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
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Hardware, Software, Rede"
              className="bg-gray-700 border-gray-600 text-white"
            />
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
