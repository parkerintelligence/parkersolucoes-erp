
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Lock, Plus, Eye, EyeOff, Edit, Trash2, Building, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Passwords = () => {
  const [passwords, setPasswords] = useState([
    { id: '1', client: 'Empresa A', system: 'ERP Sistema', url: 'https://erp.empresaa.com', username: 'admin', password: 'SecurePass123!', category: 'Sistema' },
    { id: '2', client: 'Empresa A', system: 'Email Corporativo', url: 'https://mail.empresaa.com', username: 'admin@empresaa.com', password: 'EmailPass456@', category: 'Email' },
    { id: '3', client: 'Empresa B', system: 'Painel Hospedagem', url: 'https://cpanel.empresab.com', username: 'root', password: 'HostPass789#', category: 'Hosting' },
    { id: '4', client: 'Empresa C', system: 'Banco de Dados', url: 'mysql://db.empresac.com', username: 'dbadmin', password: 'DbPass321$', category: 'Database' },
  ]);

  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  
  const [formData, setFormData] = useState({
    client: '',
    system: '',
    url: '',
    username: '',
    password: '',
    category: ''
  });

  const companies = ['Empresa A', 'Empresa B', 'Empresa C'];

  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = password.system.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || password.client === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Sistema': 'bg-blue-100 text-blue-800 border-blue-200',
      'Email': 'bg-green-100 text-green-800 border-green-200',
      'Hosting': 'bg-purple-100 text-purple-800 border-purple-200',
      'Database': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge className={colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'}>{category}</Badge>;
  };

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Senha copiada!",
      description: "A senha foi copiada para a área de transferência.",
    });
  };

  const handleSavePassword = () => {
    if (!formData.client || !formData.system || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newPassword = {
      id: Date.now().toString(),
      ...formData
    };

    setPasswords(prev => [...prev, newPassword]);
    
    toast({
      title: "Senha adicionada!",
      description: "A senha foi adicionada com sucesso ao cofre.",
    });

    setFormData({ client: '', system: '', url: '', username: '', password: '', category: '' });
    setIsDialogOpen(false);
  };

  const handleEditPassword = (password: any) => {
    setEditingPassword(password);
    setFormData({
      client: password.client,
      system: password.system,
      url: password.url,
      username: password.username,
      password: password.password,
      category: password.category
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!formData.client || !formData.system || !formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setPasswords(prev => prev.map(p => 
      p.id === editingPassword.id 
        ? { ...p, ...formData }
        : p
    ));

    toast({
      title: "Senha atualizada!",
      description: "A senha foi atualizada com sucesso.",
    });
    
    setIsEditDialogOpen(false);
    setEditingPassword(null);
    setFormData({ client: '', system: '', url: '', username: '', password: '', category: '' });
  };

  const handleDeletePassword = (id: string) => {
    setPasswords(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Senha removida!",
      description: "A senha foi removida do cofre.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Lock className="h-8 w-8" />
              Gerenciador de Senhas por Empresa
            </h1>
            <p className="text-blue-600">Cofre seguro para senhas organizadas por empresa</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
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
                  <Label htmlFor="client">Empresa Cliente *</Label>
                  <Input 
                    id="client" 
                    placeholder="Nome da empresa"
                    value={formData.client}
                    onChange={(e) => setFormData({...formData, client: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="system">Sistema *</Label>
                  <Input 
                    id="system" 
                    placeholder="Nome do sistema"
                    value={formData.system}
                    onChange={(e) => setFormData({...formData, system: e.target.value})}
                  />
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
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sistema">Sistema</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Hosting">Hosting</SelectItem>
                      <SelectItem value="Database">Database</SelectItem>
                    </SelectContent>
                  </Select>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{passwords.length}</p>
                  <p className="text-sm text-blue-600">Senhas Armazenadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{companies.length}</p>
                  <p className="text-sm text-blue-600">Empresas Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">100%</p>
                  <p className="text-sm text-blue-600">Segurança</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar senhas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Passwords Table */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Cofre de Senhas por Empresa</CardTitle>
            <CardDescription>Senhas organizadas por empresa cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasswords.map((item) => (
                  <TableRow key={item.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{item.client}</TableCell>
                    <TableCell>{item.system}</TableCell>
                    <TableCell>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          Acessar
                        </a>
                      )}
                    </TableCell>
                    <TableCell>{item.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {showPassword[item.id] ? item.password : '••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(item.id)}
                        >
                          {showPassword[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyPassword(item.password)}
                        >
                          Copiar
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(item.category)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditPassword(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeletePassword(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredPasswords.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma senha encontrada com os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Senha</DialogTitle>
              <DialogDescription>Atualize as informações da senha.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-client">Empresa Cliente *</Label>
                <Input 
                  id="edit-client" 
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-system">Sistema *</Label>
                <Input 
                  id="edit-system" 
                  value={formData.system}
                  onChange={(e) => setFormData({...formData, system: e.target.value})}
                />
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
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sistema">Sistema</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Hosting">Hosting</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEdit}>
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Passwords;
