import { useState } from 'react';
import { usePasswords, useCreatePassword, useUpdatePassword, useDeletePassword } from '@/hooks/usePasswords';
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
  Lock, Plus, Eye, EyeOff, Edit, Trash2, Building, Search, Settings, 
  Code, Mail, Server, Database, Cloud, Shield, Monitor, Globe, Filter, FileDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Password = Tables<'passwords'>;

const Passwords = () => {
  const { data: passwords = [], isLoading } = usePasswords();
  const { data: companies = [] } = useCompanies();
  const { isMaster } = useAuth();
  const createPassword = useCreatePassword();
  const updatePassword = useUpdatePassword();
  const deletePassword = useDeletePassword();

  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
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
    url: '',
    username: '',
    password: '',
    service: '',
    gera_link: false,
    notes: ''
  });

  const filteredPasswords = passwords.filter(password => {
    const companyName = companies.find(c => c.id === password.company_id)?.name || '';
    const matchesSearch = password.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || password.company_id === selectedCompany;
    const matchesService = selectedService === '' || selectedService === 'all' || password.service === selectedService;
    const matchesStatus = selectedStatus === '' || selectedStatus === 'all' || 
                         (selectedStatus === 'with_link' && password.gera_link) ||
                         (selectedStatus === 'without_link' && !password.gera_link);
    return matchesSearch && matchesCompany && matchesService && matchesStatus;
  });

  const groupedPasswords = groupByService 
    ? filteredPasswords.reduce((groups, password) => {
        const service = password.service || 'Sem Categoria';
        if (!groups[service]) groups[service] = [];
        groups[service].push(password);
        return groups;
      }, {} as Record<string, Password[]>)
    : { 'Todas as Senhas': filteredPasswords };

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
      doc.text('Relatório do Cofre de Senhas', 20, 20);
      
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
      const groupedData = filteredPasswords.reduce((acc, password) => {
        const company = companies.find(c => c.id === password.company_id);
        const companyName = company?.name || 'Sem Empresa';
        const serviceName = password.service || 'Sem Serviço';
        
        if (!acc[companyName]) {
          acc[companyName] = {};
        }
        if (!acc[companyName][serviceName]) {
          acc[companyName][serviceName] = [];
        }
        
        acc[companyName][serviceName].push(password);
        return acc;
      }, {} as Record<string, Record<string, typeof filteredPasswords>>);

      // Gerar tabelas por empresa e serviço
      Object.entries(groupedData).forEach(([companyName, services]) => {
        // Título da empresa
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Empresa: ${companyName}`, 20, yPosition);
        yPosition += 10;
        doc.setFont(undefined, 'normal');
        
        Object.entries(services).forEach(([serviceName, passwords]) => {
          // Título do serviço
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`  Serviço: ${serviceName}`, 25, yPosition);
          yPosition += 5;
          doc.setFont(undefined, 'normal');
          
          // Preparar dados da tabela
          const tableData = passwords.map(password => [
            password.name,
            password.username || 'N/A',
            password.password || 'N/A',
            password.url || 'N/A',
            password.gera_link ? 'Sim' : 'Não'
          ]);
          
          // Verificar se há espaço na página
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Adicionar tabela
          autoTable(doc, {
            head: [['Sistema', 'Usuário', 'Senha', 'URL', 'Gera Link']],
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
              2: { fontStyle: 'bold' } // Destacar coluna da senha
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
      doc.text(`Total de senhas exportadas: ${filteredPasswords.length}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Total de empresas: ${Object.keys(groupedData).length}`, 20, yPosition);
      yPosition += 5;
      
      const totalServices = Object.values(groupedData).reduce((acc, services) => {
        return acc + Object.keys(services).length;
      }, 0);
      doc.text(`Total de serviços: ${totalServices}`, 20, yPosition);
      
      // Salvar o PDF
      doc.save('cofre-de-senhas-detalhado.pdf');
      
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

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getCategoryBadge = (service: string) => {
    const colors = {
      'Sistema': 'bg-blue-100 text-blue-800 border-blue-200',
      'Email': 'bg-green-100 text-green-800 border-green-200',
      'Hosting': 'bg-purple-100 text-purple-800 border-purple-200',
      'Database': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge className={colors[service] || 'bg-gray-100 text-gray-800 border-gray-200'}>{service}</Badge>;
  };

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Senha copiada!",
      description: "A senha foi copiada para a área de transferência.",
    });
  };

  const handleSavePassword = () => {
    if (!formData.name || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    createPassword.mutate(formData);
    setFormData({ 
      name: '', 
      company_id: '', 
      url: '', 
      username: '', 
      password: '', 
      service: '', 
      gera_link: false, 
      notes: '' 
    });
    setIsDialogOpen(false);
  };

  const handleEditPassword = (password: Password) => {
    setEditingPassword(password);
    setFormData({
      name: password.name,
      company_id: password.company_id || '',
      url: password.url || '',
      username: password.username || '',
      password: password.password || '',
      service: password.service || '',
      gera_link: password.gera_link,
      notes: password.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!formData.name || !formData.username || !formData.password || !editingPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    updatePassword.mutate({ id: editingPassword.id, updates: formData });
    setIsEditDialogOpen(false);
    setEditingPassword(null);
    setFormData({ 
      name: '', 
      company_id: '', 
      url: '', 
      username: '', 
      password: '', 
      service: '', 
      gera_link: false, 
      notes: '' 
    });
  };

  const handleDeletePassword = (id: string) => {
    deletePassword.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-white">Carregando senhas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Cofre de Senhas</h1>
            <div className="flex items-center space-x-2">
              <Switch
                id="group-by-service"
                checked={groupByService}
                onCheckedChange={setGroupByService}
              />
              <Label htmlFor="group-by-service" className="text-sm text-white">Agrupar por Serviço</Label>
            </div>
          </div>
          <div className="flex gap-2">
            {isMaster && (
              <Button
                variant="outline"
                onClick={exportToPDF}
                className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsServiceDialogOpen(true)}
              className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
            >
              <Settings className="mr-2 h-4 w-4" />
              Gerenciar Serviços
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Senha
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar Nova Senha</DialogTitle>
                <DialogDescription className="text-slate-400">Preencha os dados para adicionar uma nova senha ao cofre.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-white">Nome do Sistema *</Label>
                  <Input 
                    id="name" 
                    placeholder="Nome do sistema"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company" className="text-white">Empresa Cliente</Label>
                  <Select value={formData.company_id} onValueChange={(value) => setFormData({...formData, company_id: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id} className="text-white">{company.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url" className="text-white">URL</Label>
                  <Input 
                    id="url" 
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-white">Usuário *</Label>
                  <Input 
                    id="username" 
                    placeholder="Nome de usuário"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white">Senha *</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Senha segura"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service" className="text-white">Serviço</Label>
                  <Select value={formData.service} onValueChange={(value) => setFormData({...formData, service: value})}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione o serviço" />
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
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="gera_link"
                    checked={formData.gera_link}
                    onCheckedChange={(checked) => setFormData({...formData, gera_link: checked as boolean})}
                  />
                  <Label htmlFor="gera_link" className="text-white">Gerar Link na tela de Links</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-white">Observações</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Observações adicionais"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSavePassword}>
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600 text-white hover:bg-slate-700">
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
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-white" />
              <CardTitle className="text-white">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar senhas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id} className="text-white">{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">Todos os serviços</SelectItem>
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

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Status do link" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all" className="text-white">Todos os status</SelectItem>
                  <SelectItem value="with_link" className="text-white">Com link gerado</SelectItem>
                  <SelectItem value="without_link" className="text-white">Sem link gerado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Senhas Agrupadas ou Normal */}
        {Object.entries(groupedPasswords).map(([groupName, groupPasswords]) => (
          <Card key={groupName} className="bg-slate-800 border-slate-700">
            <CardHeader className="bg-slate-700/50 border-b border-slate-600">
              <div className="flex items-center gap-2">
                {groupByService && groupName !== 'Todas as Senhas' && getServiceIcon(groupName)}
                <CardTitle className="text-white">{groupName}</CardTitle>
                <Badge variant="secondary" className="bg-blue-600 text-white">{groupPasswords.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-slate-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="font-semibold text-white">Sistema</TableHead>
                      <TableHead className="font-semibold text-white">Empresa</TableHead>
                      <TableHead className="font-semibold text-white">URL</TableHead>
                      <TableHead className="font-semibold text-white">Usuário</TableHead>
                      <TableHead className="font-semibold text-white">Senha</TableHead>
                      {!groupByService && <TableHead className="font-semibold text-white">Serviço</TableHead>}
                      <TableHead className="font-semibold text-white">Link</TableHead>
                      <TableHead className="font-semibold text-white">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupPasswords.map((item) => {
                      const company = companies.find(c => c.id === item.company_id);
                      return (
                        <TableRow key={item.id} className="hover:bg-slate-700/50 border-slate-600">
                          <TableCell className="font-medium text-white">{item.name}</TableCell>
                          <TableCell className="font-medium text-slate-300">{company?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {item.url ? (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => window.open(item.url, '_blank')}
                              >
                                Acessar
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-sm">Sem URL</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-white">{item.username}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-white">
                                {showPassword[item.id] ? item.password : '••••••••'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(item.id)}
                                className="h-8 w-8 p-0 text-white hover:bg-slate-700"
                              >
                                {showPassword[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyPassword(item.password || '')}
                                className="h-8 w-8 p-0 text-white hover:bg-slate-700"
                              >
                                📋
                              </Button>
                            </div>
                          </TableCell>
                          {!groupByService && (
                            <TableCell>
                              {item.service && (
                                <div className="flex items-center gap-1 text-white">
                                  {getServiceIcon(item.service)}
                                  <span className="text-sm">{item.service}</span>
                                </div>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {item.gera_link && (
                              <Badge className="bg-green-700 text-green-100 border-green-600">
                                Ativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditPassword(item)}
                                className="h-8 px-3 bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-400 hover:text-red-300 border-red-600 hover:bg-red-900/20 h-8 px-3"
                                onClick={() => handleDeletePassword(item.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {groupPasswords.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Nenhuma senha encontrada neste grupo.
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Senha</DialogTitle>
              <DialogDescription className="text-slate-400">Atualize as informações da senha.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name" className="text-white">Nome do Sistema *</Label>
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
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id} className="text-white">{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url" className="text-white">URL</Label>
                <Input 
                  id="edit-url" 
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-username" className="text-white">Usuário *</Label>
                <Input 
                  id="edit-username" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password" className="text-white">Senha *</Label>
                <Input 
                  id="edit-password" 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-gera_link"
                  checked={formData.gera_link}
                  onCheckedChange={(checked) => setFormData({...formData, gera_link: checked as boolean})}
                />
                <Label htmlFor="edit-gera_link" className="text-white">Gerar Link na tela de Links</Label>
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
      </div>
    </div>
  );
};

export default Passwords;
