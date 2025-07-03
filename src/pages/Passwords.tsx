import { useState } from 'react';
import { usePasswords, useCreatePassword, useUpdatePassword, useDeletePassword } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
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
  Code, Mail, Server, Database, Cloud, Shield, Monitor, Globe, Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Password = Tables<'passwords'>;

const Passwords = () => {
  const { data: passwords = [], isLoading } = usePasswords();
  const { data: companies = [] } = useCompanies();
  const createPassword = useCreatePassword();
  const updatePassword = useUpdatePassword();
  const deletePassword = useDeletePassword();

  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [groupByService, setGroupByService] = useState(true);
  const [availableServices, setAvailableServices] = useState([
    { name: 'Sistema', icon: 'code', color: 'blue' },
    { name: 'Email', icon: 'mail', color: 'green' },
    { name: 'Hosting', icon: 'server', color: 'purple' },
    { name: 'Database', icon: 'database', color: 'orange' },
    { name: 'Cloud', icon: 'cloud', color: 'sky' },
    { name: 'Security', icon: 'shield', color: 'red' },
    { name: 'Monitoring', icon: 'monitor', color: 'indigo' },
    { name: 'Config', icon: 'settings', color: 'gray' },
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
        <div className="text-slate-600">Carregando senhas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Cofre de Senhas</h1>
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
                Adicionar Senha
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Senha</DialogTitle>
              <DialogDescription>Preencha os dados para adicionar uma nova senha ao cofre.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Sistema *</Label>
                <Input 
                  id="name" 
                  placeholder="Nome do sistema"
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
                <Label htmlFor="url">URL</Label>
                <Input 
                  id="url" 
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Usuário *</Label>
                <Input 
                  id="username" 
                  placeholder="Nome de usuário"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha *</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Senha segura"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
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
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="gera_link"
                  checked={formData.gera_link}
                  onCheckedChange={(checked) => setFormData({...formData, gera_link: checked as boolean})}
                />
                <Label htmlFor="gera_link">Gerar Link na tela de Links</Label>
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
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSavePassword}>
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
                placeholder="Buscar senhas..."
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

      {/* Lista de Senhas Agrupadas ou Normal */}
      {Object.entries(groupedPasswords).map(([groupName, groupPasswords]) => (
        <Card key={groupName} className="bg-muted/30 border-border/50">
          <CardHeader className="bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              {groupByService && groupName !== 'Todas as Senhas' && getServiceIcon(groupName)}
              <CardTitle className="text-foreground">{groupName}</CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">{groupPasswords.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-background/50">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold">Sistema</TableHead>
                    <TableHead className="font-semibold">Empresa</TableHead>
                    <TableHead className="font-semibold">URL</TableHead>
                    <TableHead className="font-semibold">Usuário</TableHead>
                    <TableHead className="font-semibold">Senha</TableHead>
                    {!groupByService && <TableHead className="font-semibold">Serviço</TableHead>}
                    <TableHead className="font-semibold">Link</TableHead>
                    <TableHead className="font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupPasswords.map((item) => {
                    const company = companies.find(c => c.id === item.company_id);
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20 border-border/30">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-medium text-muted-foreground">{company?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {item.url ? (
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() => window.open(item.url, '_blank')}
                            >
                              Acessar
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sem URL</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {showPassword[item.id] ? item.password : '••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              {showPassword[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPassword(item.password || '')}
                              className="h-8 w-8 p-0"
                            >
                              📋
                            </Button>
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
                          {item.gera_link && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
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
                              className="h-8 px-3"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10 h-8 px-3"
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
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma senha encontrada neste grupo.
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Senha</DialogTitle>
            <DialogDescription>Atualize as informações da senha.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome do Sistema *</Label>
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
              <Label htmlFor="edit-url">URL</Label>
              <Input 
                id="edit-url" 
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Usuário *</Label>
              <Input 
                id="edit-username" 
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Senha *</Label>
              <Input 
                id="edit-password" 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-gera_link"
                checked={formData.gera_link}
                onCheckedChange={(checked) => setFormData({...formData, gera_link: checked as boolean})}
              />
              <Label htmlFor="edit-gera_link">Gerar Link na tela de Links</Label>
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
    </div>
  );
};

export default Passwords;
