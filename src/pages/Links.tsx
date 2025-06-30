
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { CompanyForm } from '@/components/CompanyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, Plus, Link as LinkIcon, Building, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LinkItem {
  id: string;
  company: string;
  name: string;
  url: string;
  service: string;
}

const Links = () => {
  const [links, setLinks] = useState<LinkItem[]>([
    { id: '1', company: 'Empresa A', name: 'Sistema ERP', url: 'https://erp.empresaa.com', service: 'ERP' },
    { id: '2', company: 'Empresa A', name: 'Email Corporativo', url: 'https://mail.empresaa.com', service: 'Email' },
    { id: '3', company: 'Empresa B', name: 'Painel Admin', url: 'https://admin.empresab.com', service: 'Administração' },
    { id: '4', company: 'Empresa B', name: 'Sistema Vendas', url: 'https://vendas.empresab.com', service: 'Vendas' },
  ]);

  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    url: '',
    service: ''
  });

  const companies = ['Empresa A', 'Empresa B', 'Empresa C'];
  const services = ['ERP', 'Email', 'Administração', 'Vendas', 'Financeiro', 'RH', 'Backup', 'Monitoramento'];

  // Filtrar links por empresa selecionada
  const filteredLinks = selectedCompany 
    ? links.filter(link => link.company === selectedCompany)
    : links;

  const handleSave = () => {
    if (!formData.company || !formData.name || !formData.url) {
      toast({
        title: "Erro",
        description: "Empresa, nome e URL são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newLink: LinkItem = {
      id: Date.now().toString(),
      ...formData
    };

    setLinks([...links, newLink]);
    setFormData({ company: '', name: '', url: '', service: '' });
    setIsDialogOpen(false);
    
    toast({
      title: "Sucesso!",
      description: "Link cadastrado com sucesso.",
    });
  };

  // Atualizar formulário quando empresa for selecionada no filtro
  const handleCompanyFilterChange = (company: string) => {
    setSelectedCompany(company);
    setFormData(prev => ({ ...prev, company }));
  };

  const groupedLinks = filteredLinks.reduce((acc, link) => {
    if (!acc[link.company]) {
      acc[link.company] = [];
    }
    acc[link.company].push(link);
    return acc;
  }, {} as Record<string, LinkItem[]>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-2">
              <LinkIcon className="h-8 w-8" />
              Gerenciador de Links e Empresas
            </h1>
            <p className="text-blue-600">Cadastre empresas e organize links de acesso aos sistemas</p>
          </div>
        </div>

        {/* Cadastro de Empresas */}
        <CompanyForm />

        {/* Filtro por Empresa */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrar por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="company-filter">Selecione uma empresa</Label>
                <Select value={selectedCompany} onValueChange={handleCompanyFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas as empresas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>{company}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => setSelectedCompany('')}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Limpar Filtro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cadastro de Links */}
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Links de Acesso
                {selectedCompany && (
                  <span className="text-sm font-normal text-blue-600">
                    - {selectedCompany}
                  </span>
                )}
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Link
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Link</DialogTitle>
                    <DialogDescription>
                      {selectedCompany 
                        ? `Adicione um link para ${selectedCompany}`
                        : "Adicione um link de acesso para uma empresa."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company">Empresa *</Label>
                      <Select 
                        value={formData.company} 
                        onValueChange={(value) => setFormData({...formData, company: value})}
                      >
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
                      <Label htmlFor="name">Nome do Sistema *</Label>
                      <Input 
                        id="name" 
                        placeholder="Nome do sistema"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="url">URL *</Label>
                      <Input 
                        id="url" 
                        placeholder="https://..."
                        value={formData.url}
                        onChange={(e) => setFormData({...formData, url: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="service">Tipo de Serviço</Label>
                      <Select value={formData.service} onValueChange={(value) => setFormData({...formData, service: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service}>{service}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        {/* Links Organizados por Empresa */}
        {Object.entries(groupedLinks).map(([company, companyLinks]) => (
          <Card key={company} className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Building className="h-5 w-5" />
                {company}
              </CardTitle>
              <CardDescription>{companyLinks.length} link(s) cadastrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyLinks.map((link) => (
                  <Card key={link.id} className="border-blue-100 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-blue-900">{link.name}</h4>
                        {link.service && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {link.service}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3 truncate">{link.url}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Acessar Sistema
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedCompany ? 1 : Object.keys(groupedLinks).length}
                  </p>
                  <p className="text-sm text-blue-600">
                    {selectedCompany ? 'Empresa Selecionada' : 'Empresas Cadastradas'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">{filteredLinks.length}</p>
                  <p className="text-sm text-blue-600">
                    {selectedCompany ? 'Links da Empresa' : 'Links Cadastrados'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {[...new Set(filteredLinks.map(l => l.service))].filter(Boolean).length}
                  </p>
                  <p className="text-sm text-blue-600">Tipos de Serviços</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Links;
