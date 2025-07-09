
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
    return <IconComponent className="h-4 w-4" />;
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
    <div className="space-y-4 p-4 bg-slate-900 min-h-screen">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Links de Acesso</h1>
          <p className="text-slate-400 text-sm">Gerencie seus links de sistemas</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid className="h-3 w-3" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Filtros em linha única */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center gap-3 text-xs">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-7 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="h-7 w-32 text-xs bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-xs text-white">Todas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id} className="text-xs text-white">{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="h-7 w-28 text-xs bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Serviço" />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="all" className="text-xs text-white">Todos</SelectItem>
              {uniqueServices.map((service) => (
                <SelectItem key={service} value={service} className="text-xs text-white">{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-7 w-28 text-xs bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="name" className="text-xs text-white">Nome</SelectItem>
              <SelectItem value="company" className="text-xs text-white">Empresa</SelectItem>
              <SelectItem value="service" className="text-xs text-white">Serviço</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch
              id="show-passwords"
              checked={showPasswords}
              onCheckedChange={setShowPasswords}
              className="scale-75"
            />
            <Label htmlFor="show-passwords" className="text-xs text-slate-300">Credenciais</Label>
          </div>
        </div>
      </div>

      {/* Grid/Lista de Links */}
      {sortedLinks.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {sortedLinks.map((link) => {
              const company = companies.find(c => c.id === link.company_id);
              const service = link.service || 'Sistema';
              
              return (
                <Card key={link.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors group">
                  <CardContent className="p-3">
                    {/* Header do card */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-blue-400">
                        {getServiceIcon(service)}
                      </div>
                      <Badge className="bg-slate-700 text-slate-300 text-xs px-1 py-0 h-4">
                        {service}
                      </Badge>
                    </div>

                    {/* Título e empresa */}
                    <div className="space-y-1 mb-3">
                      <h3 className="font-medium text-white text-sm truncate">{link.name}</h3>
                      <p className="text-slate-400 text-xs truncate">{company?.name || 'Sem empresa'}</p>
                    </div>

                    {/* Credenciais (se habilitado) */}
                    {showPasswords && (
                      <div className="space-y-1 mb-3 text-xs">
                        {link.username && (
                          <p className="text-slate-400 truncate">
                            <span className="text-slate-500">User:</span> {link.username}
                          </p>
                        )}
                        {link.password && (
                          <p className="text-slate-400 truncate">
                            <span className="text-slate-500">Pass:</span> ••••••••
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Botões */}
                    <div className="flex gap-1">
                      <Button 
                        className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(link.url || '#', '_blank')}
                        disabled={!link.url}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Abrir
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCredentials(link)}
                        className="h-7 w-7 p-0 border-slate-600 hover:bg-slate-700"
                      >
                        <Copy className="h-3 w-3 text-slate-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-700">
                {sortedLinks.map((link) => {
                  const company = companies.find(c => c.id === link.company_id);
                  const service = link.service || 'Sistema';
                  
                  return (
                    <div key={link.id} className="p-3 hover:bg-slate-750 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-1.5 rounded bg-slate-700 text-blue-400">
                            {getServiceIcon(service)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium truncate text-white text-sm">{link.name}</h3>
                              <Badge className="bg-slate-700 text-slate-300 text-xs">
                                {service}
                              </Badge>
                            </div>
                            <p className="text-slate-400 text-xs truncate">{company?.name || 'Sem empresa'}</p>
                            {showPasswords && (
                              <div className="mt-1 text-xs space-y-0.5">
                                {link.username && (
                                  <p className="text-slate-400"><span className="text-slate-500">User:</span> <code className="bg-slate-700 px-1 rounded">{link.username}</code></p>
                                )}
                                {link.password && (
                                  <p className="text-slate-400"><span className="text-slate-500">Pass:</span> <code className="bg-slate-700 px-1 rounded">••••••••</code></p>
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
                            className="h-7 text-xs border-slate-600 hover:bg-slate-700 text-slate-300"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                          <Button 
                            onClick={() => window.open(link.url || '#', '_blank')}
                            disabled={!link.url}
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Abrir
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
        <Card className="border-dashed border-slate-600 bg-slate-800">
          <CardContent className="p-8">
            <div className="text-center text-slate-400">
              <div className="bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link className="h-8 w-8 opacity-50" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">Nenhum link encontrado</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
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
