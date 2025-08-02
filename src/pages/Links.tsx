import * as React from 'react';
import { useState } from 'react';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { useLinksExport } from '@/hooks/useLinksExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, ExternalLink, Search, Building, Globe, Shield, Mail, Server, Database, Cloud, Code, Monitor, Settings, Filter, Grid, List, Copy, Eye, EyeOff, Download, TreePine } from 'lucide-react';
import { LinksTreeView } from '@/components/LinksTreeView';
import { toast } from '@/hooks/use-toast';
const Links = () => {
  const {
    data: passwords = [],
    isLoading
  } = usePasswords();
  const {
    data: companies = []
  } = useCompanies();
  const exportToPDF = useLinksExport();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [activeServiceTab, setActiveServiceTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'tree'>('tree');
  const [sortBy, setSortBy] = useState('name');
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>({});

  // Filtrar apenas senhas que têm gera_link = true
  const links = passwords.filter(password => password.gera_link);

  // Obter serviços únicos
  const uniqueServices = [...new Set(links.map(link => link.service).filter(Boolean))];
  const filteredLinks = links.filter(link => {
    const company = companies.find(c => c.id === link.company_id);
    const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) || company?.name.toLowerCase().includes(searchTerm.toLowerCase()) || link.username?.toLowerCase().includes(searchTerm.toLowerCase()) || link.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || link.url?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || link.company_id === selectedCompany;
    const matchesService = activeServiceTab === 'all' || link.service === activeServiceTab;
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
      'Config': Settings
    };
    const IconComponent = iconMap[service] || Globe;
    return <IconComponent className="h-4 w-4" />;
  };
  const handleCopyCredentials = (link: any) => {
    const credentials = `URL: ${link.url || 'N/A'}\nUsuário: ${link.username || 'N/A'}\nSenha: ${link.password || 'N/A'}`;
    navigator.clipboard.writeText(credentials);
    toast({
      title: "Credenciais copiadas!",
      description: "As informações de acesso foram copiadas para a área de transferência."
    });
  };
  const toggleCardVisibility = (linkId: string) => {
    setVisibleCards(prev => ({
      ...prev,
      [linkId]: !prev[linkId]
    }));
  };
  const handleOpenLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "URL não encontrada",
        description: "Este link não possui uma URL válida.",
        variant: "destructive"
      });
    }
  };
  const handleExportWithDebug = async () => {
    console.log('🚀 Iniciando exportação com debug completo...');
    console.log('📊 Estado atual:', {
      passwords: passwords.length,
      companies: companies.length,
      links: links.length,
      isLoading
    });
    toast({
      title: "🔄 Iniciando exportação",
      description: "Verificando dados e gerando PDF... Acompanhe os logs no console."
    });
    await exportToPDF.mutateAsync();
  };
  if (isLoading) {
    return <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando links...</div>
      </div>;
  }
  return <div className="space-y-4 p-4 bg-slate-900 min-h-screen">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Links de Acesso</h1>
          <p className="text-slate-400 text-sm">Gerencie seus links de sistemas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportWithDebug} disabled={exportToPDF.isPending} className="text-white h-8 px-3 bg-blue-800 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          <div className="flex items-center gap-1">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} className="h-8 w-8 p-0">
              <Grid className="h-3 w-3" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} className="h-8 w-8 p-0">
              <List className="h-3 w-3" />
            </Button>
            <Button variant={viewMode === 'tree' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('tree')} className="h-8 w-8 p-0">
              <TreePine className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros em linha única */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center gap-3 text-xs">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-400" />
            <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-7 h-7 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
          </div>
          
          {/* Temporarily commenting out Select to isolate issue */}
          <div className="h-7 w-32 text-xs bg-slate-700 border-slate-600 text-white rounded px-2 flex items-center">
            Empresa: {selectedCompany || 'Todas'}
          </div>

          {/* Temporarily commenting out Select to isolate issue */}
          <div className="h-7 w-28 text-xs bg-slate-700 border-slate-600 text-white rounded px-2 flex items-center">
            Sort: {sortBy}
          </div>
        </div>
      </div>

      {/* Temporarily commenting out Tabs to isolate React context issue */}
      <div className="w-full">
        <div className="grid w-full bg-slate-800 border-slate-700 p-2 rounded-lg mb-4">
          <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded">
            Todos ({links.length})
          </div>
        </div>

        <div className="mt-4">
          {/* Grid/Lista/Árvore de Links */}
          {viewMode === 'tree' ? (
            <LinksTreeView />
          ) : sortedLinks.length > 0 ? viewMode === 'grid' ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {sortedLinks.map(link => {
            const company = companies.find(c => c.id === link.company_id);
            const service = link.service || 'Sistema';
            const isVisible = visibleCards[link.id];
            return <Card key={link.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors group">
                      <CardContent className="p-3">
                        {/* Header do card */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-blue-400">
                            {getServiceIcon(service)}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => toggleCardVisibility(link.id)} className="h-5 w-5 p-0 border-slate-600 hover:bg-slate-700">
                            {isVisible ? <EyeOff className="h-3 w-3 text-slate-400" /> : <Eye className="h-3 w-3 text-slate-400" />}
                          </Button>
                        </div>

                        {/* Badge do serviço */}
                        <div className="mb-2">
                          <Badge className="bg-slate-700 text-slate-300 text-xs px-1 py-0 h-4">
                            {service}
                          </Badge>
                        </div>

                        {/* Título, empresa e link */}
                        <div className="space-y-1 mb-3">
                          <h3 className="font-medium text-white text-sm truncate">{link.name}</h3>
                          <p className="text-slate-400 text-xs truncate">{company?.name || 'Sem empresa'}</p>
                          {link.url && <p className="text-blue-400 text-xs truncate" title={link.url}>
                              {link.url}
                            </p>}
                        </div>

                        {/* Credenciais (se visível) */}
                        {isVisible && <div className="space-y-1 mb-3 text-xs">
                            {link.username && <p className="text-slate-400 truncate">
                                <span className="text-slate-500">User:</span> {link.username}
                              </p>}
                            {link.password && <p className="text-slate-400 truncate">
                                <span className="text-slate-500">Pass:</span> {link.password}
                              </p>}
                          </div>}
                        
                        {/* Botão central para abrir link */}
                        <div className="flex justify-center">
                          <Button className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenLink(link.url)}>
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Abrir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>;
          })}
              </div> : <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-700">
                    {sortedLinks.map(link => {
                const company = companies.find(c => c.id === link.company_id);
                const service = link.service || 'Sistema';
                const isVisible = visibleCards[link.id];
                return <div key={link.id} className="p-3 hover:bg-slate-750 transition-colors">
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
                                {link.url && <p className="text-blue-400 text-xs truncate" title={link.url}>
                                    {link.url}
                                  </p>}
                                {isVisible && <div className="mt-1 text-xs space-y-0.5">
                                    {link.username && <p className="text-slate-400"><span className="text-slate-500">User:</span> <code className="bg-slate-700 px-1 rounded">{link.username}</code></p>}
                                    {link.password && <p className="text-slate-400"><span className="text-slate-500">Pass:</span> <code className="bg-slate-700 px-1 rounded">{link.password}</code></p>}
                                  </div>}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button onClick={() => handleOpenLink(link.url)} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Abrir
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => toggleCardVisibility(link.id)} className="h-7 text-xs border-slate-600 hover:bg-slate-700 text-slate-300">
                                {isVisible ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>
                        </div>;
              })}
                  </div>
                </CardContent>
              </Card> : <Card className="border-dashed border-slate-600 bg-slate-800">
              <CardContent className="p-8">
                <div className="text-center text-slate-400">
                  <div className="bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link className="h-8 w-8 opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-white">
                    {activeServiceTab === 'all' ? 'Nenhum link encontrado' : `Nenhum link de ${activeServiceTab} encontrado`}
                  </h3>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Configure senhas com "Gerar Link" ativado para visualizar os sistemas de acesso aqui.
                  </p>
                </div>
              </CardContent>
            </Card>}
        </div>
      </div>
    </div>;
};
export default Links;