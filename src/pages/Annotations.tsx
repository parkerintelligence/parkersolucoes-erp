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
import { ServiceDialog } from '@/components/ServiceDialog';
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
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [viewingAnnotation, setViewingAnnotation] = useState<AnnotationWithCompany | null>(null);
  const [whatsAppAnnotation, setWhatsAppAnnotation] = useState<AnnotationWithCompany | null>(null);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [groupByService, setGroupByService] = useState(true);
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

  const filteredAnnotations = annotations.filter(annotation => {
    const companyName = companies.find(c => c.id === annotation.company_id)?.name || '';
    const matchesSearch = annotation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         annotation.annotation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || annotation.company_id === selectedCompany;
    const matchesService = selectedService === '' || selectedService === 'all' || annotation.service === selectedService;
    const matchesStatus = selectedStatus === '' || selectedStatus === 'all' || 
                         (selectedStatus === 'with_link' && annotation.gera_link) ||
                         (selectedStatus === 'without_link' && !annotation.gera_link);
    return matchesSearch && matchesCompany && matchesService && matchesStatus;
  });

  const groupedAnnotations = groupByService 
    ? filteredAnnotations.reduce((groups, annotation) => {
        const service = annotation.service || 'Sem Categoria';
        if (!groups[service]) groups[service] = [];
        groups[service].push(annotation);
        return groups;
      }, {} as Record<string, Annotation[]>)
    : { 'Todas as Anotações': filteredAnnotations };

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
      
      let yPosition = 40;
      
      // Mostrar filtros aplicados
      if (searchTerm || selectedCompany || selectedService || selectedStatus) {
        doc.setFontSize(10);
        doc.text('Filtros aplicados:', 20, yPosition);
        yPosition += 5;
        
        if (searchTerm) {
          doc.text(`• Busca: ${searchTerm}`, 25, yPosition);
          yPosition += 5;
        }
        if (selectedCompany && selectedCompany !== 'all') {
          const company = companies.find(c => c.id === selectedCompany);
          doc.text(`• Empresa: ${company?.name}`, 25, yPosition);
          yPosition += 5;
        }
        if (selectedService && selectedService !== 'all') {
          doc.text(`• Serviço: ${selectedService}`, 25, yPosition);
          yPosition += 5;
        }
        if (selectedStatus && selectedStatus !== 'all') {
          const statusText = selectedStatus === 'with_link' ? 'Com link' : 'Sem link';
          doc.text(`• Status: ${statusText}`, 25, yPosition);
          yPosition += 5;
        }
        yPosition += 5;
      }

      // Agrupar dados por empresa e serviço
      const groupedData = filteredAnnotations.reduce((acc, annotation) => {
        const company = companies.find(c => c.id === annotation.company_id);
        const companyName = company?.name || 'Sem Empresa';
        const serviceName = annotation.service || 'Sem Serviço';
        
        if (!acc[companyName]) {
          acc[companyName] = {};
        }
        if (!acc[companyName][serviceName]) {
          acc[companyName][serviceName] = [];
        }
        
        acc[companyName][serviceName].push(annotation);
        return acc;
      }, {} as Record<string, Record<string, typeof filteredAnnotations>>);

      // Gerar tabelas por empresa e serviço
      Object.entries(groupedData).forEach(([companyName, services]) => {
        // Título da empresa
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Empresa: ${companyName}`, 20, yPosition);
        yPosition += 10;
        doc.setFont(undefined, 'normal');
        
        Object.entries(services).forEach(([serviceName, annotations]) => {
          // Título do serviço
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`  Serviço: ${serviceName}`, 25, yPosition);
          yPosition += 5;
          doc.setFont(undefined, 'normal');
          
          // Preparar dados da tabela
          const tableData = annotations.map(annotation => [
            annotation.name,
            annotation.annotation || 'N/A',
            annotation.gera_link ? 'Sim' : 'Não'
          ]);
          
          // Verificar se há espaço na página
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Adicionar tabela
          autoTable(doc, {
            head: [['Nome', 'Anotação', 'Gera Link']],
            body: tableData,
            startY: yPosition,
            margin: { left: 30 },
            styles: { 
              fontSize: 8,
              cellPadding: 2
            },
            headStyles: { 
              fillColor: [41, 128, 185],
              textColor: [255, 255, 255]
            },
            columnStyles: {
              1: { cellWidth: 'auto' } // Ajustar largura da coluna de anotação
            }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
        });
        
        yPosition += 5; // Espaço extra entre empresas
      });

      // Resumo no final
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Resumo:', 20, yPosition);
      yPosition += 10;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Total de anotações exportadas: ${filteredAnnotations.length}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Total de empresas: ${Object.keys(groupedData).length}`, 20, yPosition);
      yPosition += 5;
      
      const totalServices = Object.values(groupedData).reduce((acc, services) => {
        return acc + Object.keys(services).length;
      }, 0);
      doc.text(`Total de serviços: ${totalServices}`, 20, yPosition);
      
      // Salvar o PDF
      doc.save('anotacoes-detalhado.pdf');
      
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

    createAnnotation.mutate(formData);
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

    updateAnnotation.mutate({ id: editingAnnotation.id, updates: formData });
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

  const handleDeleteAnnotation = (id: string) => {
    deleteAnnotation.mutate(id);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-slate-600">Carregando anotações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Anotações</h1>
          <div className="flex items-center space-x-2">
            <Switch
              id="group-by-service"
              checked={groupByService}
              onCheckedChange={setGroupByService}
            />
            <Label htmlFor="group-by-service" className="text-sm">Agrupar por Serviço</Label>
          </div>
        </div>
        <div className="flex gap-2">
          {isMaster && (
            <Button
              variant="outline"
              onClick={exportToPDF}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsServiceDialogOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Gerenciar Serviços
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Anotação
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Anotação</DialogTitle>
              <DialogDescription>Preencha os dados para adicionar uma nova anotação.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Anotação *</Label>
                <Input 
                  id="name" 
                  placeholder="Nome da anotação"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Empresa Cliente</Label>
                <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="annotation">Anotação *</Label>
                <Textarea 
                  id="annotation" 
                  placeholder="Sua anotação aqui..."
                  value={formData.annotation}
                  onChange={(e) => setFormData({...formData, annotation: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service">Serviço</Label>
                <Select value={formData.service} onValueChange={(value) => setFormData({...formData, service: value})}>
                  <SelectTrigger>
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
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Observações adicionais"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveAnnotation}>
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
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

      {/* Filtros Avançados */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar anotações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status do link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="with_link">Com link gerado</SelectItem>
                <SelectItem value="without_link">Sem link gerado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Anotações Agrupadas ou Normal */}
      {Object.entries(groupedAnnotations).map(([groupName, groupAnnotations]) => (
        <Card key={groupName} className="bg-muted/30 border-border/50">
          <CardHeader className="bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              {groupByService && groupName !== 'Todas as Anotações' && getServiceIcon(groupName)}
              <CardTitle className="text-foreground">{groupName}</CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">{groupAnnotations.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-background/50">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Empresa</TableHead>
                    <TableHead className="font-semibold">Anotação</TableHead>
                    {!groupByService && <TableHead className="font-semibold">Serviço</TableHead>}
                    <TableHead className="font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupAnnotations.map((item) => {
                    const company = companies.find(c => c.id === item.company_id);
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20 border-border/30">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">{company?.name || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate" title={item.annotation || ''}>
                            {item.annotation || 'N/A'}
                          </div>
                        </TableCell>
                        {!groupByService && (
                          <TableCell>
                            {item.service && (
                              <div className="flex items-center gap-1">
                                {getServiceIcon(item.service)}
                                <span className="text-sm">{item.service}</span>
                              </div>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewAnnotation(item)}
                              className="h-8 px-3 text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleWhatsAppShare(item)}
                              className="h-8 px-3 text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditAnnotation(item)}
                              className="h-8 px-3"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10 h-8 px-3"
                              onClick={() => handleDeleteAnnotation(item.id)}
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
            </div>
            {groupAnnotations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma anotação encontrada neste grupo.
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Anotação</DialogTitle>
            <DialogDescription>Atualize as informações da anotação.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome da Anotação *</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Empresa Cliente</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-annotation">Anotação *</Label>
              <Textarea 
                id="edit-annotation" 
                value={formData.annotation}
                onChange={(e) => setFormData({...formData, annotation: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-service">Serviço</Label>
              <Select value={formData.service} onValueChange={(value) => setFormData({...formData, service: value})}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea 
                id="edit-notes" 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEdit}>
              Atualizar
            </Button>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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
    </div>
  );
};

export default Annotations;