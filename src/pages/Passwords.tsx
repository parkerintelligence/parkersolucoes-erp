
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Lock, Plus, Eye, EyeOff, Edit, Trash2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Passwords = () => {
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const passwords = [
    { id: '1', client: 'Cliente A', system: 'ERP Sistema', url: 'https://erp.clientea.com', username: 'admin', password: 'SecurePass123!', category: 'Sistema' },
    { id: '2', client: 'Cliente A', system: 'Email Corporativo', url: 'https://mail.clientea.com', username: 'admin@clientea.com', password: 'EmailPass456@', category: 'Email' },
    { id: '3', client: 'Cliente B', system: 'Painel Hospedagem', url: 'https://cpanel.clienteb.com', username: 'root', password: 'HostPass789#', category: 'Hosting' },
    { id: '4', client: 'Cliente C', system: 'Banco de Dados', url: 'mysql://db.clientec.com', username: 'dbadmin', password: 'DbPass321$', category: 'Database' },
  ];

  const links = [
    { id: '1', client: 'Cliente A', name: 'Portal Administrativo', url: 'https://admin.clientea.com', description: 'Painel principal de administração' },
    { id: '2', client: 'Cliente B', name: 'Sistema de Vendas', url: 'https://vendas.clienteb.com', description: 'Sistema de gestão de vendas' },
    { id: '3', client: 'Cliente C', name: 'Monitoramento', url: 'https://monitor.clientec.com', description: 'Dashboard de monitoramento' },
  ];

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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Lock className="h-8 w-8" />
              Gerenciador de Senhas e Acessos
            </h1>
            <p className="text-blue-600">Cofre seguro para senhas e links de acesso</p>
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
                  <Label htmlFor="client">Cliente</Label>
                  <Input id="client" placeholder="Nome do cliente" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="system">Sistema</Label>
                  <Input id="system" placeholder="Nome do sistema" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" placeholder="https://..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input id="username" placeholder="Nome de usuário" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="Senha segura" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsDialogOpen(false)}>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <ExternalLink className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{links.length}</p>
                  <p className="text-sm text-blue-600">Links de Acesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">3</p>
                  <p className="text-sm text-blue-600">Clientes Ativos</p>
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

        {/* Passwords Table */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Cofre de Senhas</CardTitle>
            <CardDescription>Senhas armazenadas de forma segura e criptografada</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passwords.map((item) => (
                  <TableRow key={item.id} className="hover:bg-blue-50">
                    <TableCell className="font-medium">{item.client}</TableCell>
                    <TableCell>{item.system}</TableCell>
                    <TableCell>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Acessar
                      </a>
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
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Links Table */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Links de Acesso Rápido</CardTitle>
            <CardDescription>Links organizados para acesso rápido aos sistemas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {links.map((link) => (
                <Card key={link.id} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-blue-900">{link.name}</h4>
                      <Badge variant="outline" className="text-xs">{link.client}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-3 w-3" />
                      Acessar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Passwords;
