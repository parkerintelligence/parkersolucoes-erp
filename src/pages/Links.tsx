import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link, ExternalLink, Search, Building } from 'lucide-react';

const Links = () => {
  const { data: passwords = [], isLoading } = usePasswords();
  const { data: companies = [] } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  // Filtrar apenas senhas que têm gera_link = true
  const links = passwords.filter(password => password.gera_link);

  const filteredLinks = links.filter(link => {
    const company = companies.find(c => c.id === link.company_id);
    const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || link.company_id === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const getCategoryBadge = (service: string) => {
    const colors = {
      'Sistema': 'bg-green-100 text-green-800 border-green-200',
      'Email': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Hosting': 'bg-purple-100 text-purple-800 border-purple-200',
      'Database': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return <Badge className={colors[service] || 'bg-gray-100 text-gray-800 border-gray-200'}>{service}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="text-slate-600">Carregando links...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Link className="h-6 w-6" />
              Links por Empresa
            </h1>
            <p className="text-slate-600 text-sm">Links gerados automaticamente do sistema de senhas</p>
          </div>
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
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Links Grid */}
        {filteredLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLinks.map((link) => {
              const company = companies.find(c => c.id === link.company_id);
              return (
                <Card key={link.id} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-blue-900">{link.name}</h4>
                      {link.service && getCategoryBadge(link.service)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{company?.name || 'Empresa'}</p>
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(link.url || '#', '_blank')}
                        disabled={!link.url}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Acessar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-blue-200">
            <CardContent className="p-8">
              <div className="text-center text-gray-500">
                <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum link encontrado. Configure senhas com "Gerar Link" ativado.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Links;