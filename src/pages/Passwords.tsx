import * as React from 'react';
import { usePasswords, useCreatePassword, useUpdatePassword, useDeletePassword } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext.minimal';
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
import { WhatsAppPasswordDialog } from '@/components/WhatsAppPasswordDialog';
import { Lock, Plus, Eye, EyeOff, Edit, Trash2, Building, Search, Settings, Code, Mail, Server, Database, Cloud, Shield, Monitor, Globe, Filter, FileDown, MessageCircle, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
type Password = Tables<'passwords'>;
type PasswordWithCompany = Password & {
  company?: string;
};
const Passwords = () => {
  const {
    data: passwords = [],
    isLoading
  } = usePasswords();
  const {
    data: companies = []
  } = useCompanies();
  const {
    isMaster
  } = useAuth();
  const createPassword = useCreatePassword();
  const updatePassword = useUpdatePassword();
  const deletePassword = useDeletePassword();
  const [showPassword, setShowPassword] = React.useState<{
    [key: string]: boolean;
  }>({});
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = React.useState(false);
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = React.useState(false);
  const [editingPassword, setEditingPassword] = React.useState<Password | null>(null);
  const [whatsAppPassword, setWhatsAppPassword] = React.useState<PasswordWithCompany | null>(null);
  const [editingService, setEditingService] = React.useState<any | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCompany, setSelectedCompany] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const [activeServiceTab, setActiveServiceTab] = React.useState('all');
  const [availableServices, setAvailableServices] = React.useState([{
    name: 'Sistema',
    icon: 'code',
    color: 'blue',
    description: ''
  }, {
    name: 'Email',
    icon: 'mail',
    color: 'green',
    description: ''
  }, {
    name: 'Hosting',
    icon: 'server',
    color: 'purple',
    description: ''
  }, {
    name: 'Database',
    icon: 'database',
    color: 'orange',
    description: ''
  }, {
    name: 'Cloud',
    icon: 'cloud',
    color: 'sky',
    description: ''
  }, {
    name: 'Security',
    icon: 'shield',
    color: 'red',
    description: ''
  }, {
    name: 'Monitoring',
    icon: 'monitor',
    color: 'indigo',
    description: ''
  }, {
    name: 'Config',
    icon: 'settings',
    color: 'gray',
    description: ''
  }]);
  const [formData, setFormData] = React.useState({
    name: '',
    company_id: '',
    url: '',
    username: '',
    password: '',
    service: '',
    gera_link: false,
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
      'globe': Globe
    };
    const IconComponent = iconMap[service?.icon as keyof typeof iconMap] || Code;
    return <IconComponent className="h-4 w-4" />;
  };
  const filteredPasswordsBase = passwords.filter(password => {
    const companyName = companies.find(c => c.id === password.company_id)?.name || '';
    const matchesSearch = password.name.toLowerCase().includes(searchTerm.toLowerCase()) || companyName.toLowerCase().includes(searchTerm.toLowerCase()) || password.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || password.company_id === selectedCompany;
    const matchesStatus = selectedStatus === '' || selectedStatus === 'all' || selectedStatus === 'with_link' && password.gera_link || selectedStatus === 'without_link' && !password.gera_link;
    return matchesSearch && matchesCompany && matchesStatus;
  });
  const getFilteredPasswordsByService = (serviceName: string) => {
    if (serviceName === 'all') return filteredPasswordsBase;
    if (serviceName === 'no_service') return filteredPasswordsBase.filter(p => !p.service);
    return filteredPasswordsBase.filter(p => p.service === serviceName);
  };
  const getServiceTabs = () => {
    const serviceTabs = [];

    // Tab "Todas"
    const totalCount = filteredPasswordsBase.length;
    serviceTabs.push({
      name: 'all',
      label: 'Todas',
      count: totalCount,
      icon: 'globe'
    });

    // Tabs dos serviços disponíveis
    availableServices.forEach(service => {
      const count = getFilteredPasswordsByService(service.name).length;
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
    const noServiceCount = getFilteredPasswordsByService('no_service').length;
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
  const handleWhatsAppShare = (password: Password) => {
    const company = companies.find(c => c.id === password.company_id);
    setWhatsAppPassword({
      ...password,
      company: company?.name
    });
    setIsWhatsAppDialogOpen(true);
  };
  const handleSaveService = (serviceData: any) => {
    setAvailableServices(prev => [...prev, serviceData]);
    toast({
      title: "Serviço adicionado!",
      description: `Serviço "${serviceData.name}" foi criado com sucesso.`
    });
  };
  const handleEditService = (serviceData: any) => {
    setAvailableServices(prev => prev.map(service => service.name === editingService?.name ? serviceData : service));
    setEditingService(null);
    toast({
      title: "Serviço atualizado!",
      description: `Serviço "${serviceData.name}" foi atualizado com sucesso.`
    });
  };
  const handleDeleteService = (serviceName: string) => {
    setAvailableServices(prev => prev.filter(service => service.name !== serviceName));
    toast({
      title: "Serviço removido!",
      description: `Serviço "${serviceName}" foi removido com sucesso.`
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
      const {
        jsPDF
      } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();

      // Título
      doc.setFontSize(20);
      doc.text('Relatório do Cofre de Senhas', 20, 20);

      // Data e filtros aplicados
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
      const currentPasswords = getFilteredPasswordsByService(activeServiceTab);

      // Preparar dados da tabela
      const tableData = currentPasswords.map(password => {
        const company = companies.find(c => c.id === password.company_id);
        return [password.name, company?.name || 'N/A', password.username || 'N/A', password.password || 'N/A', password.url || 'N/A', password.service || 'N/A', password.gera_link ? 'Sim' : 'Não'];
      });

      // Adicionar tabela
      autoTable(doc, {
        head: [['Sistema', 'Empresa', 'Usuário', 'Senha', 'URL', 'Serviço', 'Gera Link']],
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
      doc.save('cofre-de-senhas.pdf');
      toast({
        title: "PDF gerado!",
        description: "O relatório foi exportado com sucesso."
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
  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Senha copiada!",
      description: "A senha foi copiada para a área de transferência."
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
    updatePassword.mutate({
      id: editingPassword.id,
      updates: formData
    });
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
  const renderPasswordTable = (passwordsToShow: Password[]) => <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-600">
            <TableHead className="font-semibold text-white">Sistema</TableHead>
            <TableHead className="font-semibold text-white">Empresa</TableHead>
            <TableHead className="font-semibold text-white">URL</TableHead>
            <TableHead className="font-semibold text-white">Usuário</TableHead>
            <TableHead className="font-semibold text-white">Senha</TableHead>
            <TableHead className="font-semibold text-white">Link</TableHead>
            <TableHead className="font-semibold text-white">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {passwordsToShow.map(item => {
          const company = companies.find(c => c.id === item.company_id);
          return <TableRow key={item.id} className="hover:bg-slate-700/50 border-slate-600 h-10">
                <TableCell className="font-medium text-white py-1">{item.name}</TableCell>
                <TableCell className="font-medium text-white py-1">{company?.name || 'N/A'}</TableCell>
                <TableCell className="py-1">
                  {item.url ? <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7" onClick={() => window.open(item.url, '_blank')}>
                      Acessar
                    </Button> : <span className="text-white text-sm">Sem URL</span>}
                </TableCell>
                <TableCell className="font-mono text-sm text-white py-1">{item.username}</TableCell>
                <TableCell className="py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-white">
                      {showPassword[item.id] ? item.password : '••••••••'}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => togglePasswordVisibility(item.id)} 
                      className="h-7 w-7 p-0 bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                      title={showPassword[item.id] ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword[item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopyPassword(item.password || '')} 
                      className="h-7 w-7 p-0 bg-green-600 border-green-500 text-white hover:bg-green-700"
                      title="Copiar senha"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="py-1">
                  {item.gera_link && <Badge className="bg-green-700 text-green-100 border-green-600">
                      Ativo
                    </Badge>}
                </TableCell>
                <TableCell className="py-1">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleWhatsAppShare(item)}
                      className="h-7 w-7 p-0 bg-green-600 border-green-500 text-white hover:bg-green-700"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditPassword(item)}
                      className="h-7 w-7 p-0 bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
                      title="Editar"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 border-red-600 hover:bg-red-900/20"
                      onClick={() => handleDeletePassword(item.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
      {passwordsToShow.length === 0 && <div className="text-center py-8 text-white">
          Nenhuma senha encontrada nesta categoria.
        </div>}
    </div>;
  if (isLoading) {
    return <div className="flex justify-center items-center h-96">
        <div className="text-white">Carregando senhas...</div>
      </div>;
  }
  return <div className="min-h-screen bg-slate-900 text-white">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Cofre de Senhas</h1>
          <div className="flex gap-2">
            {isMaster && <Button variant="outline" onClick={exportToPDF} className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>}
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(true)} className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700">
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
                  <Input id="name" placeholder="Nome do sistema" value={formData.name} onChange={e => setFormData({
                    ...formData,
                    name: e.target.value
                  })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company" className="text-white">Empresa Cliente</Label>
                  <Select value={formData.company_id} onValueChange={value => setFormData({
                    ...formData,
                    company_id: value
                  })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {companies.map(company => <SelectItem key={company.id} value={company.id} className="text-white">{company.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url" className="text-white">URL</Label>
                  <Input id="url" placeholder="https://..." value={formData.url} onChange={e => setFormData({
                    ...formData,
                    url: e.target.value
                  })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-white">Usuário *</Label>
                  <Input id="username" placeholder="Nome de usuário" value={formData.username} onChange={e => setFormData({
                    ...formData,
                    username: e.target.value
                  })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-white">Senha *</Label>
                  <Input id="password" type="password" placeholder="Senha segura" value={formData.password} onChange={e => setFormData({
                    ...formData,
                    password: e.target.value
                  })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="service" className="text-white">Serviço</Label>
                  <Select value={formData.service} onValueChange={value => setFormData({
                    ...formData,
                    service: value
                  })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {availableServices.map(service => <SelectItem key={service.name} value={service.name} className="text-white">
                          <div className="flex items-center gap-2">
                            {getServiceIcon(service.name)}
                            {service.name}
                          </div>
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="gera_link" checked={formData.gera_link} onCheckedChange={checked => setFormData({
                    ...formData,
                    gera_link: checked as boolean
                  })} />
                  <Label htmlFor="gera_link" className="text-white">Gerar Link na tela de Links</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes" className="text-white">Observações</Label>
                  <Textarea id="notes" placeholder="Observações adicionais" value={formData.notes} onChange={e => setFormData({
                    ...formData,
                    notes: e.target.value
                  })} className="bg-slate-700 border-slate-600 text-white" />
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
        <ServiceDialog isOpen={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen} onSave={handleSaveService} editingService={editingService} onEdit={handleEditService} onDelete={handleDeleteService} existingServices={availableServices} />

        {/* Filtros */}
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
          <Filter className="h-4 w-4 text-slate-400" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-sm bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-8 w-40 text-sm bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">Todas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id} className="text-white">{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-8 w-32 text-sm bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="with_link" className="text-white">Com link</SelectItem>
              <SelectItem value="without_link" className="text-white">Sem link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Abas por Tipo de Serviço */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <Tabs value={activeServiceTab} onValueChange={setActiveServiceTab}>
              <TabsList className="bg-slate-700 mb-6 h-auto flex-wrap">
                {getServiceTabs().map(tab => <TabsTrigger key={tab.name} value={tab.name} className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 m-1">
                    <div className="flex items-center gap-2">
                      {tab.name === 'all' && <Globe className="h-4 w-4" />}
                      {tab.name === 'no_service' && <Settings className="h-4 w-4" />}
                      {tab.name !== 'all' && tab.name !== 'no_service' && getServiceIcon(tab.name)}
                      <span>{tab.label}</span>
                      <Badge variant="secondary" className="bg-blue-600 text-white ml-1">
                        {tab.count}
                      </Badge>
                    </div>
                  </TabsTrigger>)}
              </TabsList>

              {getServiceTabs().map(tab => <TabsContent key={tab.name} value={tab.name}>
                  {renderPasswordTable(getFilteredPasswordsByService(tab.name))}
                </TabsContent>)}
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialog para WhatsApp */}
        {whatsAppPassword && <WhatsAppPasswordDialog open={isWhatsAppDialogOpen} onOpenChange={setIsWhatsAppDialogOpen} password={whatsAppPassword} />}

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
                <Input id="edit-name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-company" className="text-white">Empresa Cliente</Label>
                <Select value={formData.company_id} onValueChange={value => setFormData({
                ...formData,
                company_id: value
              })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {companies.map(company => <SelectItem key={company.id} value={company.id} className="text-white">{company.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-url" className="text-white">URL</Label>
                <Input id="edit-url" value={formData.url} onChange={e => setFormData({
                ...formData,
                url: e.target.value
              })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-username" className="text-white">Usuário *</Label>
                <Input id="edit-username" value={formData.username} onChange={e => setFormData({
                ...formData,
                username: e.target.value
              })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password" className="text-white">Senha *</Label>
                <Input id="edit-password" type="password" value={formData.password} onChange={e => setFormData({
                ...formData,
                password: e.target.value
              })} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-service" className="text-white">Serviço</Label>
                <Select value={formData.service} onValueChange={value => setFormData({
                ...formData,
                service: value
              })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {availableServices.map(service => <SelectItem key={service.name} value={service.name} className="text-white">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(service.name)}
                          {service.name}
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="edit-gera_link" checked={formData.gera_link} onCheckedChange={checked => setFormData({
                ...formData,
                gera_link: checked as boolean
              })} />
                <Label htmlFor="edit-gera_link" className="text-white">Gerar Link na tela de Links</Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes" className="text-white">Observações</Label>
                <Textarea id="edit-notes" value={formData.notes} onChange={e => setFormData({
                ...formData,
                notes: e.target.value
              })} className="bg-slate-700 border-slate-600 text-white" />
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
    </div>;
};
export default Passwords;