import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Search,
  Server,
  Database,
  Monitor,
  Smartphone,
  Globe,
  HardDrive
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  useScheduleServices, 
  useCreateScheduleService, 
  useUpdateScheduleService, 
  useDeleteScheduleService 
} from '@/hooks/useScheduleServices';
import type { Tables } from '@/integrations/supabase/types';

type ScheduleService = Tables<'schedule_services'>;

interface ScheduleServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SERVICE_CATEGORIES = [
  { value: 'sistema', label: 'Sistema', icon: Monitor, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'backup', label: 'Backup', icon: HardDrive, color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'servidor', label: 'Servidor', icon: Server, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'banco_dados', label: 'Banco de Dados', icon: Database, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'aplicativo', label: 'Aplicativo', icon: Smartphone, color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'web', label: 'Website/Portal', icon: Globe, color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
];

export const ScheduleServicesDialog = ({ open, onOpenChange }: ScheduleServicesDialogProps) => {
  const { data: services = [], isLoading } = useScheduleServices();
  const createService = useCreateScheduleService();
  const updateService = useUpdateScheduleService();
  const deleteService = useDeleteScheduleService();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ScheduleService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ''
  });

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const category = service.category || 'outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, ScheduleService[]>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e categoria são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (editingService) {
      updateService.mutate({ 
        id: editingService.id, 
        updates: formData 
      });
    } else {
      createService.mutate(formData);
    }

    setFormData({ name: '', description: '', category: '' });
    setEditingService(null);
    setShowForm(false);
  };

  const handleEdit = (service: ScheduleService) => {
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category || ''
    });
    setEditingService(service);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este sistema/serviço?')) {
      deleteService.mutate(id);
    }
  };

  const getCategoryInfo = (category: string) => {
    return SERVICE_CATEGORIES.find(cat => cat.value === category) || {
      value: category,
      label: category,
      icon: Settings,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '' });
    setEditingService(null);
    setShowForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5" />
            Gerenciar Sistemas/Serviços
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Gerencie os sistemas e serviços disponíveis para agendamentos recorrentes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="list" className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="categories">Por Categoria</TabsTrigger>
            </TabsList>
            
            <Button onClick={() => setShowForm(true)} className="mb-2">
              <Plus className="mr-2 h-4 w-4" />
              Novo Sistema/Serviço
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sistemas/serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {SERVICE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="list" className="space-y-4">
            <div className="border rounded-lg max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => {
                    const categoryInfo = getCategoryInfo(service.category || '');
                    const IconComponent = categoryInfo.icon;
                    
                    return (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge className={categoryInfo.color}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {categoryInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {service.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(service.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {filteredServices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum sistema/serviço encontrado.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => {
                const categoryInfo = getCategoryInfo(category);
                const IconComponent = categoryInfo.icon;
                
                return (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {categoryInfo.label} ({categoryServices.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {categoryServices.map((service) => (
                          <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium text-sm">{service.name}</div>
                              {service.description && (
                                <div className="text-xs text-muted-foreground">{service.description}</div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(service)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Formulário */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-700 bg-slate-800 text-white p-6 shadow-lg duration-200 sm:rounded-lg">
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight text-white">
                  {editingService ? 'Editar Sistema/Serviço' : 'Novo Sistema/Serviço'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Sistema ERP, Backup Servidor Principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {category.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição opcional do sistema/serviço"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createService.isPending || updateService.isPending}
                  >
                    {editingService ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};