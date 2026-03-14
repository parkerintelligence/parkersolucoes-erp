
import { useState } from 'react';
import { useAnnotations, useCreateAnnotation, useUpdateAnnotation, useDeleteAnnotation } from '@/hooks/useAnnotations';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceDialog } from '@/components/ServiceDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { 
  StickyNote, Plus, Edit, Trash2, Building, Search, Settings, 
  Code, Mail, Server, Database, Cloud, Shield, Monitor, Globe, Filter, FileDown,
  MessageCircle, Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WhatsAppAnnotationDialog } from '@/components/WhatsAppAnnotationDialog';
import { ViewAnnotationDialog } from '@/components/ViewAnnotationDialog';
import type { Tables } from '@/integrations/supabase/types';

type Annotation = Tables<'annotations'>;
type AnnotationWithCompany = Annotation & { company?: string };

const Annotations = () => {
  const { data: annotations = [], isLoading } = useAnnotations();
  const { data: companies = [] } = useCompanies();
  const { isMaster } = useAuth();
  const createAnnotation = useCreateAnnotation();
  const updateAnnotation = useUpdateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    annotationId: string | null;
    annotationName: string;
  }>({ open: false, annotationId: null, annotationName: '' });
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [viewingAnnotation, setViewingAnnotation] = useState<AnnotationWithCompany | null>(null);
  const [whatsAppAnnotation, setWhatsAppAnnotation] = useState<AnnotationWithCompany | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeServiceTab, setActiveServiceTab] = useState('all');
  const [availableServices, setAvailableServices] = useState([
    { name: 'Sistema', icon: 'code', color: 'blue', description: '' },
    { name: 'Email', icon: 'mail', color: 'green', description: '' },
    { name: 'Hosting', icon: 'server', color: 'purple', description: '' },
    { name: 'Database', icon: 'database', color: 'orange', description: '' },
    { name: 'Cloud', icon: 'cloud', color: 'sky', description: '' },
    { name: 'Security', icon: 'shield', color: 'red', description: '' },
    { name: 'Monitoring', icon: 'monitor', color: 'indigo', description: '' },
    { name: 'Config', icon: 'settings', color: 'gray', description: '' },
  ]);
  
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    annotation: '',
    service: '',
    notes: ''
  });

  const getServiceIcon = (serviceName: string) => {
    const service = availableServices.find(s => s.name === serviceName);
    const iconMap = {
      'code': Code,
      'mail': Mail,
      'server': Server,
      'database': Database,
      'cloud': Cloud,
      'shield': Shield,
      'monitor': Monitor,
      'settings': Settings,
      'globe': Globe,
    };
    const IconComponent = iconMap[service?.icon as keyof typeof iconMap] || Code;
    return <IconComponent className="h-4 w-4" />;
  };

  const filteredAnnotationsBase = annotations.filter(annotation => {
    const companyName = companies.find(c => c.id === annotation.company_id)?.name || '';
    const matchesSearch = annotation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         annotation.annotation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || annotation.company_id === selectedCompany;
    const matchesStatus = selectedStatus === '' || selectedStatus === 'all' || 
                         (selectedStatus === 'with_link' && annotation.gera_link) ||
                         (selectedStatus === 'without_link' && !annotation.gera_link);
    return matchesSearch && matchesCompany && matchesStatus;
  });

  const getFilteredAnnotationsByService = (serviceName: string) => {
    if (serviceName === 'all') return filteredAnnotationsBase;
    if (serviceName === 'no_service') return filteredAnnotationsBase.filter(a => !a.service);
    return filteredAnnotationsBase.filter(a => a.service === serviceName);
  };

  const getServiceTabs = () => {
    const serviceTabs = [];
    
    // Tab "Todas"
    const totalCount = filteredAnnotationsBase.length;
    serviceTabs.push({
      name: 'all',
      label: 'Todas',
      count: totalCount,
      icon: 'globe'
    });
    
    // Tabs dos serviços disponíveis
    availableServices.forEach(service => {
      const count = getFilteredAnnotationsByService(service.name).length;
      if (count > 0) {
        serviceTabs.push({
          name: service.name,
          label: service.name,
          count: count,
          icon: service.icon
        });
      }
    });
    
    // Tab "Sem Categoria"
    const noServiceCount = getFilteredAnnotationsByService('no_service').length;
    if (noServiceCount > 0) {
      serviceTabs.push({
        name: 'no_service',
        label: 'Sem Categoria',
        count: noServiceCount,
        icon: 'settings'
      });
    }
    
    return serviceTabs;
  };

  const handleSaveService = (serviceData: any) => {
    setAvailableServices(prev => [...prev, serviceData]);
    toast({
      title: "Serviço adicionado!",
      description: `Serviço "${serviceData.name}" foi criado com sucesso.`,
    });
  };

  const handleEditService = (serviceData: any) => {
    setAvailableServices(prev => 
      prev.map(service => 
        service.name === editingService?.name ? serviceData : service
      )
    );
    setEditingService(null);
    toast({
      title: "Serviço atualizado!",
      description: `Serviço "${serviceData.name}" foi atualizado com sucesso.`,
    });
  };

  const handleDeleteService = (serviceName: string) => {
    setAvailableServices(prev => prev.filter(service => service.name !== serviceName));
    toast({
      title: "Serviço removido!",
      description: `Serviço "${serviceName}" foi removido com sucesso.`,
    });
  };

  const exportToPDF = async () => {
    if (!isMaster) {
      toast({
        title: "Acesso negado",
        description: "Apenas usuários master podem exportar dados.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório de Anotações', 20, 20);
      
      // Data e filtros aplicados
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      
      const currentAnnotations = getFilteredAnnotationsByService(activeServiceTab);
      
      // Preparar dados da tabela
      const tableData = currentAnnotations.map(annotation => {
        const company = companies.find(c => c.id === annotation.company_id);
        return [
          annotation.name,
          company?.name || 'N/A',
          annotation.annotation || 'N/A',
          annotation.service || 'N/A',
          annotation.gera_link ? 'Sim' : 'Não'
        ];
      });
      
      // Adicionar tabela
      autoTable(doc, {
        head: [['Nome', 'Empresa', 'Anotação', 'Serviço', 'Gera Link']],
        body: tableData,
        startY: 50,
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255]
        }
      });
      
      // Salvar o PDF
      doc.save('anotacoes.pdf');
      
      toast({
        title: "PDF gerado!",
        description: "O relatório foi exportado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao exportar os dados.",
        variant: "destructive"
      });
    }
  };

  const handleSaveAnnotation = () => {
    if (!formData.name || !formData.annotation) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    createAnnotation.mutate({
      ...formData,
      company_id: formData.company_id && formData.company_id !== 'none' ? formData.company_id : null,
    } as any);
    setFormData({ 
      name: '', 
      company_id: '', 
      annotation: '', 
      service: '', 
      notes: '' 
    });
    setIsDialogOpen(false);
  };

  const handleEditAnnotation = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setFormData({
      name: annotation.name,
      company_id: annotation.company_id || '',
      annotation: annotation.annotation || '',
      service: annotation.service || '',
      notes: annotation.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!formData.name || !formData.annotation || !editingAnnotation) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    updateAnnotation.mutate({ id: editingAnnotation.id, updates: {
      ...formData,
      company_id: formData.company_id && formData.company_id !== 'none' ? formData.company_id : null,
    } });
    setIsEditDialogOpen(false);
    setEditingAnnotation(null);
    setFormData({ 
      name: '', 
      company_id: '', 
      annotation: '', 
      service: '', 
      notes: '' 
    });
  };

  const handleDeleteAnnotation = () => {
    if (deleteConfirmDialog.annotationId) {
      deleteAnnotation.mutate(deleteConfirmDialog.annotationId);
      setDeleteConfirmDialog({ open: false, annotationId: null, annotationName: '' });
    }
  };

  const handleWhatsAppShare = (annotation: Annotation) => {
    const company = companies.find(c => c.id === annotation.company_id);
    setWhatsAppAnnotation({
      ...annotation,
      company: company?.name
    });
    setIsWhatsAppDialogOpen(true);
  };

  const handleViewAnnotation = (annotation: Annotation) => {
    const company = companies.find(c => c.id === annotation.company_id);
    setViewingAnnotation({
      ...annotation,
      company: company?.name
    });
    setIsViewDialogOpen(true);
  };

  const renderAnnotationTable = (annotationsToShow: Annotation[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
            <TableHead className="text-muted-foreground text-xs">Empresa</TableHead>
            <TableHead className="text-muted-foreground text-xs">Anotação</TableHead>
            <TableHead className="text-muted-foreground text-xs">Observações</TableHead>
            <TableHead className="text-muted-foreground text-xs">Serviço</TableHead>
            <TableHead className="text-muted-foreground text-xs w-32 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {annotationsToShow.map((item) => {
            const company = companies.find(c => c.id === item.company_id);
            return (
              <TableRow key={item.id} className="border-border/50 hover:bg-muted/20">
                <TableCell className="text-xs font-medium text-foreground py-1">{item.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground py-1">{company?.name || 'N/A'}</TableCell>
                <TableCell className="py-1 max-w-xs">
                  <div className="truncate text-xs text-foreground" title={item.annotation || ''}>
                    {item.annotation || 'N/A'}
                  </div>
                </TableCell>
                <TableCell className="py-1 max-w-xs">
                  <div className="truncate text-xs text-muted-foreground" title={item.notes || ''}>
                    {item.notes || '-'}
                  </div>
                </TableCell>
                <TableCell className="py-1">
                  {item.service && (
                    <div className="flex items-center gap-1">
                      {getServiceIcon(item.service)}
                      <span className="text-xs text-foreground">{item.service}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-1 text-right">
                  <div className="flex justify-end gap-0.5">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewAnnotation(item)}
                      className="h-6 w-6 p-0"
                      title="Ver"
                    >
                      <Eye className="h-2.5 w-2.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleWhatsAppShare(item)}
                      className="h-6 w-6 p-0 text-green-500"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-2.5 w-2.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditAnnotation(item)}
                      className="h-6 w-6 p-0"
                      title="Editar"
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteConfirmDialog({ 
                        open: true, 
                        annotationId: item.id, 
                        annotationName: item.name 
                      })}
                      title="Excluir"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {annotationsToShow.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nenhuma anotação encontrada nesta categoria.
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando anotações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              Anotações
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Gerencie suas anotações e documentações</p>
          </div>
          <div className="flex gap-2">
            {isMaster && (
              <Button variant="outline" onClick={exportToPDF} size="sm" className="h-8 text-xs">
                <FileDown className="mr-1.5 h-3.5 w-3.5" />
                Exportar PDF
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(true)} size="sm" className="h-8 text-xs">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Gerenciar Serviços
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Adicionar Anotação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] border-border bg-card">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Adicionar Nova Anotação</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Preencha os dados para adicionar uma nova anotação.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="name" className="text-foreground text-xs">Nome da Anotação *</Label>
                    <Input 
                      id="name" 
                      placeholder="Nome da anotação"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-background border-border h-8 text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="company" className="text-foreground text-xs">Empresa Cliente</Label>
                    <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                      <SelectTrigger className="bg-background border-border h-8 text-xs">
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma (sem empresa)</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="annotation" className="text-foreground text-xs">Anotação *</Label>
                    <Textarea 
                      id="annotation" 
                      placeholder="Sua anotação aqui..."
                      value={formData.annotation}
                      onChange={(e) => setFormData({...formData, annotation: e.target.value})}
                      className="bg-background border-border text-xs"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="service" className="text-foreground text-xs">Serviço</Label>
                    <Select value={formData.service} onValueChange={(value) => setFormData({...formData, service: value})}>
                      <SelectTrigger className="bg-background border-border h-8 text-xs">
                        <SelectValue placeholder="Selecione o serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((service) => (
                          <SelectItem key={service.name} value={service.name}>
                            <div className="flex items-center gap-2">
                              {getServiceIcon(service.name)}
                              {service.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="notes" className="text-foreground text-xs">Observações</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Observações adicionais"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="bg-background border-border text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSaveAnnotation}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ServiceDialog */}
        <ServiceDialog 
          isOpen={isServiceDialogOpen}
          onOpenChange={setIsServiceDialogOpen}
          onSave={handleSaveService}
          editingService={editingService}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          existingServices={availableServices}
        />

        {/* Filtros */}
        <div className="flex items-center gap-3 p-2.5 bg-muted/30 border border-border rounded-lg">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-7 text-xs bg-card border-border"
            />
          </div>
          
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-7 w-40 text-xs bg-card border-border">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-7 w-32 text-xs bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with_link">Com link</SelectItem>
              <SelectItem value="without_link">Sem link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Abas por Tipo de Serviço */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <Tabs value={activeServiceTab} onValueChange={setActiveServiceTab}>
              <TabsList className="bg-muted/50 mb-4 h-auto flex-wrap border border-border">
                {getServiceTabs().map((tab) => (
                  <TabsTrigger 
                    key={tab.name} 
                    value={tab.name}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground text-xs m-0.5"
                  >
                    <div className="flex items-center gap-1.5">
                      {tab.name === 'all' && <Globe className="h-3 w-3" />}
                      {tab.name === 'no_service' && <Settings className="h-3 w-3" />}
                      {tab.name !== 'all' && tab.name !== 'no_service' && getServiceIcon(tab.name)}
                      <span>{tab.label}</span>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5">
                        {tab.count}
                      </Badge>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {getServiceTabs().map((tab) => (
                <TabsContent key={tab.name} value={tab.name}>
                  {renderAnnotationTable(getFilteredAnnotationsByService(tab.name))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Anotação</DialogTitle>
              <DialogDescription className="text-slate-400">Atualize as informações da anotação.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="text-white">Nome da Anotação *</Label>
                <Input 
                  id="edit-name" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company" className="text-white">Empresa Cliente</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="none" className="text-slate-400">Nenhuma (sem empresa)</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id} className="text-white">{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-annotation" className="text-white">Anotação *</Label>
                <Textarea 
                  id="edit-annotation" 
                  value={formData.annotation}
                  onChange={(e) => setFormData({...formData, annotation: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-service" className="text-white">Serviço</Label>
                <Select value={formData.service} onValueChange={(value) => setFormData({...formData, service: value})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {availableServices.map((service) => (
                      <SelectItem key={service.name} value={service.name} className="text-white">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(service.name)}
                          {service.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes" className="text-white">Observações</Label>
                <Textarea 
                  id="edit-notes" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveEdit}>
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-slate-600 text-white hover:bg-slate-700">
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para WhatsApp */}
        {whatsAppAnnotation && (
          <WhatsAppAnnotationDialog
            open={isWhatsAppDialogOpen}
            onOpenChange={setIsWhatsAppDialogOpen}
            annotation={whatsAppAnnotation}
          />
        )}

        {/* Dialog para Visualização */}
        {viewingAnnotation && (
          <ViewAnnotationDialog
            open={isViewDialogOpen}
            onOpenChange={setIsViewDialogOpen}
            annotation={viewingAnnotation}
          />
        )}

        {/* Dialog de confirmação de exclusão */}
        <DeleteConfirmDialog
          open={deleteConfirmDialog.open}
          onOpenChange={(open) => setDeleteConfirmDialog({ ...deleteConfirmDialog, open })}
          itemName={deleteConfirmDialog.annotationName}
          itemType="anotação"
          onConfirm={handleDeleteAnnotation}
        />
    </div>
  );
};

export default Annotations;
