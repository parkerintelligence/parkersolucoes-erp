import { useState } from 'react';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Link, 
  ExternalLink, 
  Search, 
  Building, 
  Globe,
  Shield,
  Mail,
  Server,
  Database,
  Cloud,
  Code,
  Zap,
  Monitor,
  Settings
} from 'lucide-react';

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

  const getServiceIcon = (service: string) => {
    const iconMap = {
      'Sistema': Code,
      'Email': Mail,
      'Hosting': Server,
      'Database': Database,
      'Cloud': Cloud,
      'Security': Shield,
      'Monitoring': Monitor,
      'Config': Settings,
    };
    const IconComponent = iconMap[service] || Globe;
    return <IconComponent className="h-5 w-5" />;
  };

  const getServiceColor = (service: string) => {
    const colorMap = {
      'Sistema': 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      'Email': 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
      'Hosting': 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      'Database': 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
      'Cloud': 'from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700',
      'Security': 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      'Monitoring': 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      'Config': 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
    };
    return colorMap[service] || 'from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700';
  };

  const getBadgeColor = (service: string) => {
    const badgeColors = {
      'Sistema': 'bg-blue-100 text-blue-800 border-blue-200',
      'Email': 'bg-amber-100 text-amber-800 border-amber-200',
      'Hosting': 'bg-purple-100 text-purple-800 border-purple-200',
      'Database': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Cloud': 'bg-sky-100 text-sky-800 border-sky-200',
      'Security': 'bg-red-100 text-red-800 border-red-200',
      'Monitoring': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Config': 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return badgeColors[service] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando links...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary/20 rounded-2xl p-8 text-primary-foreground">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-secondary/20 p-3 rounded-xl backdrop-blur-sm">
              <Link className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Links de Acesso</h1>
              <p className="text-primary-foreground/80">Gerencie todos os seus links de sistemas e serviços</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{links.length}</p>
                  <p className="text-sm text-primary-foreground/80">Total de Links</p>
                </div>
              </div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Building className="h-6 w-6 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{companies.length}</p>
                  <p className="text-sm text-primary-foreground/80">Empresas</p>
                </div>
              </div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{filteredLinks.length}</p>
                  <p className="text-sm text-primary-foreground/80">Links Ativos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-2xl"></div>
      </div>

      {/* Filtros Modernos */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar links, empresas ou notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-background/50 border-border/50"
              />
            </div>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full md:w-64 h-12 bg-background/50 border-border/50">
                <SelectValue placeholder="Todas as empresas" />
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

      {/* Grid de Links Coloridos */}
      {filteredLinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLinks.map((link) => {
            const company = companies.find(c => c.id === link.company_id);
            const service = link.service || 'Sistema';
            
            return (
              <Card key={link.id} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Header colorido */}
                  <div className={`bg-gradient-to-r ${getServiceColor(service)} p-4 text-white`}>
                    <div className="flex items-center justify-between mb-2">
                      {getServiceIcon(service)}
                      <Badge className={`${getBadgeColor(service)} text-xs font-medium`}>
                        {service}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg truncate">{link.name}</h3>
                    <p className="text-white/80 text-sm truncate">{company?.name || 'Empresa'}</p>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    {link.notes && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{link.notes}</p>
                    )}
                    
                    <Button 
                      className={`w-full bg-gradient-to-r ${getServiceColor(service)} text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                      onClick={() => window.open(link.url || '#', '_blank')}
                      disabled={!link.url}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Acessar Sistema
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <div className="bg-muted/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Link className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum link encontrado</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Configure senhas com "Gerar Link" ativado para visualizar os sistemas de acesso aqui.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Links;