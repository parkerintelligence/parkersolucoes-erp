import { useState } from 'react';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Monitor,
  Settings,
  Filter,
  Grid,
  List,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Links = () => {
  const { data: passwords = [], isLoading } = usePasswords();
  const { data: companies = [] } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [groupByService, setGroupByService] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('name');

  // Filtrar apenas senhas que têm gera_link = true
  const links = passwords.filter(password => password.gera_link);

  // Obter serviços únicos
  const uniqueServices = [...new Set(links.map(link => link.service).filter(Boolean))];

  const filteredLinks = links.filter(link => {
    const company = companies.find(c => c.id === link.company_id);
    const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.url?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || link.company_id === selectedCompany;
    const matchesService = selectedService === '' || selectedService === 'all' || link.service === selectedService;
    return matchesSearch && matchesCompany && matchesService;
  });

  // Ordenar links
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    const companyA = companies.find(c => c.id === a.company_id);
    const companyB = companies.find(c => c.id === b.company_id);
    
    switch (sortBy) {
      case 'company':
        return (companyA?.name || '').localeCompare(companyB?.name || '');
      case 'service':
        return (a.service || '').localeCompare(b.service || '');
      case 'recent':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      default:
        return a.name.localeCompare(b.name);
    }
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

  const handleCopyCredentials = (link: any) => {
    const credentials = `URL: ${link.url || 'N/A'}\nUsuário: ${link.username || 'N/A'}\nSenha: ${link.password || 'N/A'}`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Credenciais copiadas!",
      description: "As informações de acesso foram copiadas para a área de transferência.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando links...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Links de Acesso</h1>
          <p className="text-muted-foreground">Gerencie todos os seus links de sistemas e serviços</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros Avançados */}
      <Card className="bg-muted/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filtros Avançados</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar links..."
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
                {uniqueServices.map((service) => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
                <SelectItem value="recent">Mais recentes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-passwords"
                checked={showPasswords}
                onCheckedChange={setShowPasswords}
              />
              <Label htmlFor="show-passwords" className="text-sm">Mostrar credenciais</Label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="group-by-service"
              checked={groupByService}
              onCheckedChange={setGroupByService}
            />
            <Label htmlFor="group-by-service" className="text-sm">Agrupar por serviço</Label>
          </div>
        </CardContent>
      </Card>


      {/* Lista/Grid de Links */}
      {sortedLinks.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedLinks.map((link) => {
              const company = companies.find(c => c.id === link.company_id);
              const service = link.service || 'Sistema';
              
              return (
                <Card key={link.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header colorido */}
                    <div className={`bg-gradient-to-r ${getServiceColor(service)} p-4 text-white relative`}>
                      <div className="flex items-center justify-between mb-2">
                        {getServiceIcon(service)}
                        <Badge className="bg-white/20 text-white text-xs font-medium border-white/30">
                          {service}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg truncate">{link.name}</h3>
                      <p className="text-white/80 text-sm truncate">{company?.name || 'Sem empresa'}</p>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4 space-y-3">
                      {showPasswords && (
                        <div className="space-y-2">
                          {link.username && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Usuário:</span>
                              <p className="font-mono text-sm truncate">{link.username}</p>
                            </div>
                          )}
                          {link.password && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Senha:</span>
                              <p className="font-mono text-sm truncate">{link.password}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {link.notes && (
                        <p className="text-muted-foreground text-sm line-clamp-2">{link.notes}</p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          className={`flex-1 bg-gradient-to-r ${getServiceColor(service)} text-white border-0 shadow-md hover:shadow-lg transition-all duration-300`}
                          onClick={() => window.open(link.url || '#', '_blank')}
                          disabled={!link.url}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Acessar
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCredentials(link)}
                          className="px-3"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {sortedLinks.map((link) => {
                  const company = companies.find(c => c.id === link.company_id);
                  const service = link.service || 'Sistema';
                  
                  return (
                    <div key={link.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${getServiceColor(service)} text-white`}>
                            {getServiceIcon(service)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{link.name}</h3>
                              <Badge className={`${getBadgeColor(service)} text-xs`}>
                                {service}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm truncate">{company?.name || 'Sem empresa'}</p>
                            {showPasswords && (
                              <div className="mt-2 text-xs space-y-1">
                                {link.username && (
                                  <p><span className="text-muted-foreground">Usuário:</span> <code className="bg-muted px-1 rounded">{link.username}</code></p>
                                )}
                                {link.password && (
                                  <p><span className="text-muted-foreground">Senha:</span> <code className="bg-muted px-1 rounded">{link.password}</code></p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyCredentials(link)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </Button>
                          <Button 
                            onClick={() => window.open(link.url || '#', '_blank')}
                            disabled={!link.url}
                            className="bg-primary"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Acessar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-dashed">
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