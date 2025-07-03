import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, Plus, Edit, Trash2, Play, Pause, TestTube,
  MessageCircle, Calendar, AlertTriangle, ExternalLink, HardDrive
} from 'lucide-react';
import { 
  useScheduledReports, 
  useCreateScheduledReport, 
  useUpdateScheduledReport, 
  useDeleteScheduledReport,
  useTestScheduledReport,
  ScheduledReport 
} from '@/hooks/useScheduledReports';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import { toast } from '@/hooks/use-toast';
import WhatsAppTemplatesPanel from './WhatsAppTemplatesPanel';

const ScheduledReportsPanel = () => {
  const { data: reports = [], isLoading, refetch } = useScheduledReports();
  const { data: templates = [] } = useWhatsAppTemplates();
  const createReport = useCreateScheduledReport();
  const updateReport = useUpdateScheduledReport();
  const deleteReport = useDeleteScheduledReport();
  const testReport = useTestScheduledReport();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    report_type: 'backup_alert' | 'schedule_critical' | 'glpi_summary';
    phone_number: string;
    cron_expression: string;
    is_active: boolean;
    settings: any;
  }>({
    name: '',
    report_type: 'backup_alert' as const,
    phone_number: '',
    cron_expression: '0 9 * * *', // 9h da manhã todos os dias
    is_active: true,
    settings: {}
  });

  const reportTypes = {
    backup_alert: { 
      name: 'Alerta de Backups', 
      icon: HardDrive, 
      color: 'bg-red-100 text-red-800',
      description: 'Relatório de backups desatualizados'
    },
    schedule_critical: { 
      name: 'Vencimentos Críticos', 
      icon: Calendar, 
      color: 'bg-orange-100 text-orange-800',
      description: 'Itens da agenda com vencimento próximo'
    },
    glpi_summary: { 
      name: 'Resumo GLPI', 
      icon: ExternalLink, 
      color: 'bg-blue-100 text-blue-800',
      description: 'Chamados abertos no GLPI'
    }
  };

  // Buscar templates ativos disponíveis
  const availableReportTypes = useMemo(() => {
    console.log('Templates carregados:', templates);
    const activeTemplates = templates.filter(template => template.is_active);
    console.log('Templates ativos filtrados:', activeTemplates);
    
    // Mapear templates para opções de tipo de relatório
    return activeTemplates.map(template => ({
      value: template.template_type,
      name: template.name,
      description: `Template: ${template.name}`,
      icon: reportTypes[template.template_type as keyof typeof reportTypes]?.icon || reportTypes.backup_alert.icon,
      color: reportTypes[template.template_type as keyof typeof reportTypes]?.color || reportTypes.backup_alert.color,
      template: template
    }));
  }, [templates]);

  const cronPresets = [
    { label: '6:00 - Todo dia', value: '0 6 * * *' },
    { label: '9:00 - Todo dia', value: '0 9 * * *' },
    { label: '12:00 - Todo dia', value: '0 12 * * *' },
    { label: '18:00 - Todo dia', value: '0 18 * * *' },
    { label: '8:00 - Segunda a Sexta', value: '0 8 * * 1-5' },
    { label: '9:00 - Segunda a Sexta', value: '0 9 * * 1-5' },
  ];

  const handleSaveReport = async () => {
    if (!formData.name || !formData.phone_number || !formData.cron_expression) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, telefone e horário.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se existe template ativo para o tipo selecionado
    const selectedTemplate = availableReportTypes.find(type => type.value === formData.report_type);
    if (!selectedTemplate) {
      toast({
        title: "Template não encontrado",
        description: "Não há template ativo para o tipo de relatório selecionado.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingReport) {
        await updateReport.mutateAsync({
          id: editingReport.id,
          updates: formData
        });
      } else {
        await createReport.mutateAsync(formData);
      }
      
      setIsDialogOpen(false);
      setEditingReport(null);
      setFormData({
        name: '',
        report_type: 'backup_alert',
        phone_number: '',
        cron_expression: '0 9 * * *',
        is_active: true,
        settings: {}
      });
      refetch();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    }
  };

  const handleEditReport = (report: ScheduledReport) => {
    setEditingReport(report);
    setFormData({
      name: report.name,
      report_type: report.report_type,
      phone_number: report.phone_number,
      cron_expression: report.cron_expression,
      is_active: report.is_active,
      settings: report.settings || {}
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await updateReport.mutateAsync({
        id: report.id,
        updates: { is_active: !report.is_active }
      });
      refetch();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      try {
        await deleteReport.mutateAsync(id);
        refetch();
      } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
      }
    }
  };

  const handleTestReport = async (reportId: string) => {
    try {
      await testReport.mutateAsync(reportId);
    } catch (error) {
      console.error('Erro ao testar relatório:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    const reportType = reportTypes[type];
    const Icon = reportType.icon;
    return (
      <Badge className={reportType.color}>
        <Icon className="h-3 w-3 mr-1" />
        {reportType.name}
      </Badge>
    );
  };

  const formatNextExecution = (datetime: string) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleString('pt-BR');
  };

  const formatCronExpression = (cron: string) => {
    const preset = cronPresets.find(p => p.value === cron);
    return preset ? preset.label : cron;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-slate-600">Carregando agendamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Automação</h2>
          <p className="text-muted-foreground">Configure relatórios automáticos e templates de mensagens WhatsApp</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
               <Button 
                onClick={() => {
                  setEditingReport(null);
                  // Definir o primeiro template disponível como padrão
                  const firstAvailableTemplate = availableReportTypes[0];
                  if (firstAvailableTemplate) {
                    setFormData({
                      name: '',
                      report_type: firstAvailableTemplate.value,
                      phone_number: '',
                      cron_expression: '0 9 * * *',
                      is_active: true,
                      settings: {}
                    });
                  }
                }}
                disabled={availableReportTypes.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                {availableReportTypes.length === 0 ? 'Configure Templates Primeiro' : 'Novo Agendamento'}
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingReport ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
              <DialogDescription>
                Configure um relatório automático para ser enviado via WhatsApp
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Agendamento *</Label>
                <Input 
                  id="name" 
                  placeholder="ex: Relatório Diário de Backups"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="report_type">Tipo de Relatório *</Label>
                <Select value={formData.report_type} onValueChange={(value: any) => setFormData({...formData, report_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo de relatório" />
                  </SelectTrigger>
                   <SelectContent>
                     {availableReportTypes.length === 0 ? (
                       <div className="p-4 text-center text-gray-500">
                         <p>Nenhum template ativo encontrado.</p>
                         <p className="text-xs mt-1">Crie templates na aba "Templates" primeiro.</p>
                       </div>
                     ) : (
                       availableReportTypes.map((template, index) => (
                         <SelectItem key={`${template.value}-${index}`} value={template.value}>
                           <div className="flex items-center gap-2">
                             <template.icon className="h-4 w-4" />
                             <div>
                               <div>{template.name}</div>
                               <div className="text-xs text-gray-500">{template.description}</div>
                               <div className="text-xs text-blue-600">
                                 Tipo: {reportTypes[template.value as keyof typeof reportTypes]?.name || template.value}
                               </div>
                             </div>
                           </div>
                         </SelectItem>
                       ))
                     )}
                   </SelectContent>
                </Select>
                {availableReportTypes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Configure templates ativos na aba "Templates" para criar agendamentos.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone_number">Número WhatsApp *</Label>
                <Input 
                  id="phone_number" 
                  placeholder="5511999999999"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cron_expression">Horário de Envio *</Label>
                <Select value={formData.cron_expression} onValueChange={(value) => setFormData({...formData, cron_expression: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cronPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Ativar agendamento</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveReport} disabled={createReport.isPending || updateReport.isPending}>
                {editingReport ? 'Atualizar' : 'Criar'}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="active">Agendamentos Ativos</TabsTrigger>
          <TabsTrigger value="all">Todos os Agendamentos</TabsTrigger>
          <TabsTrigger value="inactive">Inativos</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <WhatsAppTemplatesPanel />
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos Ativos</CardTitle>
              <CardDescription>
                Relatórios que estão sendo executados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Próxima Execução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.filter(r => r.is_active).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{getTypeBadge(report.report_type)}</TableCell>
                      <TableCell className="font-mono">{report.phone_number}</TableCell>
                      <TableCell>{formatNextExecution(report.next_execution || '')}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestReport(report.id)}
                            disabled={testReport.isPending}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleActive(report)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditReport(report)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reports.filter(r => r.is_active).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento ativo encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Agendamentos</CardTitle>
              <CardDescription>
                Lista completa de todos os relatórios agendados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Execuções</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{getTypeBadge(report.report_type)}</TableCell>
                      <TableCell className="font-mono">{report.phone_number}</TableCell>
                      <TableCell>{formatCronExpression(report.cron_expression)}</TableCell>
                      <TableCell>{report.execution_count}</TableCell>
                      <TableCell>
                        {report.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestReport(report.id)}
                            disabled={testReport.isPending}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleActive(report)}
                          >
                            {report.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditReport(report)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reports.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos Inativos</CardTitle>
              <CardDescription>
                Relatórios que foram pausados ou desativados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Última Execução</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.filter(r => !r.is_active).map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{getTypeBadge(report.report_type)}</TableCell>
                      <TableCell className="font-mono">{report.phone_number}</TableCell>
                      <TableCell>{formatNextExecution(report.last_execution || '')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleActive(report)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditReport(report)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reports.filter(r => !r.is_active).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum agendamento inativo encontrado.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScheduledReportsPanel;