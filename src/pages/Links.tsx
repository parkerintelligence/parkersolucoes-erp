import * as React from 'react';
import { useState } from 'react';
// import { usePasswords } from '@/hooks/usePasswords';
// import { useCompanies } from '@/hooks/useCompanies';
// import { useLinksExport } from '@/hooks/useLinksExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, ExternalLink, Search, Building, Globe, Shield, Mail, Server, Database, Cloud, Code, Monitor, Settings, Filter, Grid, List, Copy, Eye, EyeOff, Download, TreePine } from 'lucide-react';
// import { LinksTreeView } from '@/components/LinksTreeView';
// import { toast } from '@/hooks/use-toast';
const Links = () => {
  // Temporarily disabled due to React hooks corruption
  // const {
  //   data: passwords = [],
  //   isLoading
  // } = usePasswords();
  // const {
  //   data: companies = []
  // } = useCompanies();
  
  // Static fallback data
  const passwords = [];
  const isLoading = false;
  const companies = [];
  // const exportToPDF = useLinksExport();
  const exportToPDF = { mutateAsync: async () => {}, isPending: false };
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
    // toast({
    //   title: "Credenciais copiadas!",
    //   description: "As informações de acesso foram copiadas para a área de transferência."
    // });
    console.log("Credenciais copiadas para área de transferência");
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
      // toast({
      //   title: "URL não encontrada",
      //   description: "Este link não possui uma URL válida.",
      //   variant: "destructive"
      // });
      console.log("URL não encontrada para este link");
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
    // toast({
    //   title: "🔄 Iniciando exportação",
    //   description: "Verificando dados e gerando PDF... Acompanhe os logs no console."
    // });
    console.log("Iniciando exportação...");
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
          
          {/* Temporarily simplified company filter */}
          <div className="text-xs text-white">
            <span className="text-slate-400">Empresa: </span>
            <span className="text-blue-400">{selectedCompany === 'all' ? 'Todas' : companies.find(c => c.id === selectedCompany)?.name || 'Todas'}</span>
          </div>

          {/* Temporarily simplified sort filter */}
          <div className="text-xs text-white">
            <span className="text-slate-400">Ordenar: </span>
            <span className="text-blue-400">{sortBy === 'name' ? 'Nome' : sortBy === 'company' ? 'Empresa' : 'Serviço'}</span>
          </div>
        </div>
      </div>

      {/* Simplified content without tabs */}
      <div className="mt-4">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="text-center text-slate-400">
            <div className="bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link className="h-8 w-8 opacity-50" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-white">
              Sistema em Modo de Emergência
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              O sistema está operando em modo simplificado devido a problemas técnicos temporários. 
              Os dados e funcionalidades serão restaurados em breve.
            </p>
            <div className="mt-4 text-xs text-slate-500">
              Links encontrados: {sortedLinks.length} | Empresas: {companies.length}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Links;