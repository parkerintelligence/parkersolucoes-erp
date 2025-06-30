
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link, Plus, ExternalLink, Edit, Trash2, Search, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Links = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  const links = [
    { id: '1', client: 'Empresa A', name: 'Portal Administrativo', url: 'https://admin.empresaa.com', description: 'Painel principal de administração', category: 'Admin' },
    { id: '2', client: 'Empresa A', name: 'Sistema ERP', url: 'https://erp.empresaa.com', description: 'Sistema de gestão empresarial', category: 'Sistema' },
    { id: '3', client: 'Empresa B', name: 'Sistema de Vendas', url: 'https://vendas.empresab.com', description: 'Sistema de gestão de vendas', category: 'Vendas' },
    { id: '4', client: 'Empresa B', name: 'CRM', url: 'https://crm.empresab.com', description: 'Gestão de relacionamento com cliente', category: 'CRM' },
    { id: '5', client: 'Empresa C', name: 'Monitoramento', url: 'https://monitor.empresac.com', description: 'Dashboard de monitoramento', category: 'Monitor' },
    { id: '6', client: 'Empresa C', name: 'Email Corporativo', url: 'https://mail.empresac.com', description: 'Webmail da empresa', category: 'Email' },
  ];

  const companies = ['Empresa A', 'Empresa B', 'Empresa C'];

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || link.client === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const getCategoryBadge = (category: string) => {
    const colors = {
      'Admin': 'bg-blue-100 text-blue-800 border-blue-200',
      'Sistema': 'bg-green-100 text-green-800 border-green-200',
      'Vendas': 'bg-purple-100 text-purple-800 border-purple-200',
      'CRM': 'bg-orange-100 text-orange-800 border-orange-200',
      'Monitor': 'bg-red-100 text-red-800 border-red-200',
      'Email': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return <Badge className={colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'}>{category}</Badge>;
  };

  const groupedLinks = companies.reduce((acc, company) => {
    acc[company] = filteredLinks.filter(link => link.client === company);
    return acc;
  }, {} as Record<string, typeof links>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <Link className="h-8 w-8" />
              Links por Empresa
            </h1>
            <p className="text-blue-600">Gerencie links organizados por empresa cliente</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Link
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Link</DialogTitle>
                <DialogDescription>Preencha os dados para adicionar um novo link.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Empresa Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Link</Label>
                  <Input id="name" placeholder="Nome descritivo" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" placeholder="https://..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" placeholder="Breve descrição do link" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Sistema">Sistema</SelectItem>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="CRM">CRM</SelectItem>
                      <SelectItem value="Monitor">Monitor</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                    </SelectContent>
                  </Select>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Link className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{links.length}</p>
                  <p className="text-sm text-blue-600">Total de Links</p>
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
                <ExternalLink className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{filteredLinks.length}</p>
                  <p className="text-sm text-blue-600">Links Filtrados</p>
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
                    placeholder="Buscar links..."
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

        {/* Links Grid by Company */}
        {companies.map((company) => {
          const companyLinks = groupedLinks[company];
          if (companyLinks.length === 0 && selectedCompany === '') return null;
          if (selectedCompany !== '' && selectedCompany !== company) return null;

          return (
            <Card key={company} className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {company}
                </CardTitle>
                <CardDescription>
                  Links de acesso para {company} ({companyLinks.length} links)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {companyLinks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companyLinks.map((link) => (
                      <Card key={link.id} className="border-blue-100 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-blue-900">{link.name}</h4>
                            {getCategoryBadge(link.category)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                          <div className="flex items-center justify-between">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                            >
                              <ExternalLink className="mr-2 h-3 w-3" />
                              Acessar
                            </Button>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum link encontrado para {company}.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredLinks.length === 0 && (
          <Card className="border-blue-200">
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum link encontrado com os filtros aplicados.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Links;
