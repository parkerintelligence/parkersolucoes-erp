
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScheduleItem } from '@/hooks/useScheduleItems';
import { useCompanies } from '@/hooks/useCompanies';
import { useScheduleTypes } from '@/hooks/useScheduleTypes';
import { useGLPI } from '@/hooks/useGLPI';

interface ScheduleFormProps {
  onSubmit: (item: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status' | 'type'>, createGLPITicket?: boolean) => void;
  initialData?: any;
}

export const ScheduleForm = ({ onSubmit, initialData }: ScheduleFormProps) => {
  const { data: companies = [] } = useCompanies();
  const { data: scheduleTypes = [] } = useScheduleTypes();
  const { glpiIntegration } = useGLPI();
  
  const [formData, setFormData] = React.useState({
    title: initialData?.title || '',
    schedule_type_id: initialData?.schedule_type_id || '',
    due_date: initialData?.due_date || '',
    description: initialData?.description || '',
    company: initialData?.company || '',
    company_id: initialData?.company_id || ''
  });

  const [createGLPITicket, setCreateGLPITicket] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.schedule_type_id || !formData.due_date || !formData.company) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      title: formData.title,
      schedule_type_id: formData.schedule_type_id,
      due_date: formData.due_date,
      description: formData.description,
      company: formData.company,
      company_id: formData.company_id || null
    }, createGLPITicket);
    
    setFormData({
      title: '',
      schedule_type_id: '',
      due_date: '',
      description: '',
      company: '',
      company_id: ''
    });
  };

  const handleCompanyChange = (companyId: string) => {
    const selectedCompany = companies.find(c => c.id === companyId);
    setFormData({
      ...formData,
      company_id: companyId,
      company: selectedCompany?.name || ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-gray-300">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Renovação Certificado SSL"
          className="bg-slate-900 border-gray-700 text-white placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schedule_type_id" className="text-gray-300">Tipo *</Label>
        <Select value={formData.schedule_type_id} onValueChange={(value) => setFormData({ ...formData, schedule_type_id: value })}>
          <SelectTrigger className="bg-slate-900 border-gray-700 text-white">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-gray-700">
            {scheduleTypes.map((type) => (
              <SelectItem key={type.id} value={type.id} className="text-white hover:bg-gray-800">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company" className="text-gray-300">Empresa *</Label>
        <Select value={formData.company_id} onValueChange={handleCompanyChange}>
          <SelectTrigger className="bg-slate-900 border-gray-700 text-white">
            <SelectValue placeholder="Selecione a empresa" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-gray-700">
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id} className="text-white hover:bg-gray-800">
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date" className="text-gray-300">Data de Vencimento *</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          className="bg-slate-900 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detalhes sobre o agendamento..."
          rows={3}
          className="bg-slate-900 border-gray-700 text-white placeholder:text-gray-400"
        />
      </div>

      {glpiIntegration && !initialData && (
        <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
          <Checkbox
            id="create_glpi_ticket"
            checked={createGLPITicket}
            onCheckedChange={(checked) => setCreateGLPITicket(checked as boolean)}
          />
          <Label htmlFor="create_glpi_ticket" className="text-sm text-gray-300">
            Criar chamado no GLPI na data de vencimento
          </Label>
        </div>
      )}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        <Plus className="mr-2 h-4 w-4" />
        {initialData ? 'Atualizar Agendamento' : 'Adicionar Agendamento'}
      </Button>
    </form>
  );
};
