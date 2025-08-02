import React, { useState } from 'react';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { SafeCollapsible } from '@/components/SafeCollapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Building, 
  ExternalLink, 
  Eye, 
  EyeOff,
  Globe,
  Mail,
  Server,
  Database,
  Cloud,
  Shield,
  Monitor,
  Settings,
  Code,
  Expand,
  Minimize2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const LinksTreeView = () => {
  const { data: passwords = [] } = usePasswords();
  const { data: companies = [] } = useCompanies();
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Filtrar apenas senhas que têm gera_link = true
  const links = passwords.filter(password => password.gera_link);

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

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const toggleService = (serviceKey: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceKey)) {
      newExpanded.delete(serviceKey);
    } else {
      newExpanded.add(serviceKey);
    }
    setExpandedServices(newExpanded);
  };

  const togglePasswordVisibility = (passwordId: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(passwordId)) {
      newVisible.delete(passwordId);
    } else {
      newVisible.add(passwordId);
    }
    setVisiblePasswords(newVisible);
  };

  const expandAll = () => {
    // Expandir todas as empresas
    const allCompanyIds = Object.keys(linksTree);
    setExpandedCompanies(new Set(allCompanyIds));
    
    // Expandir todos os serviços
    const allServiceKeys = Object.entries(linksTree).flatMap(([companyId, services]) =>
      Object.keys(services).map(serviceName => `${companyId}-${serviceName}`)
    );
    setExpandedServices(new Set(allServiceKeys));
  };

  const collapseAll = () => {
    setExpandedCompanies(new Set());
    setExpandedServices(new Set());
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

  // Organizar dados em árvore: Company -> Service -> Links
  const organizeLinksTree = () => {
    const tree: { [companyId: string]: { [service: string]: any[] } } = {};
    
    links.forEach(link => {
      const companyId = link.company_id || 'no-company';
      const service = link.service || 'Sem categoria';
      
      if (!tree[companyId]) {
        tree[companyId] = {};
      }
      if (!tree[companyId][service]) {
        tree[companyId][service] = [];
      }
      tree[companyId][service].push(link);
    });
    
    return tree;
  };

  const linksTree = organizeLinksTree();

  if (links.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <Building className="h-16 w-16 mx-auto mb-4 text-slate-400 opacity-50" />
          <h3 className="text-lg font-medium mb-2 text-white">
            Nenhum link encontrado
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Configure senhas com "Gerar Link" ativado para visualizar na árvore organizacional.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        {/* Botões de Expandir/Recolher */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <Expand className="h-4 w-4 mr-2" />
            Expandir Tudo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Recolher Tudo
          </Button>
        </div>
        
        <div className="space-y-1">
          {Object.entries(linksTree).map(([companyId, services]) => {
            const company = companies.find(c => c.id === companyId);
            const companyName = company?.name || 'Sem empresa';
            const isCompanyExpanded = expandedCompanies.has(companyId);
            
            return (
              <div key={companyId}>
                <Button
                  variant="ghost"
                  className="w-full justify-start py-1 px-2 h-auto text-left hover:bg-slate-700"
                  onClick={() => toggleCompany(companyId)}
                >
                  <div className="flex items-center gap-2 text-white">
                    {isCompanyExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Building className="h-4 w-4" />
                    <span className="truncate">{companyName}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {Object.values(services).reduce((total, serviceLinks) => total + serviceLinks.length, 0)}
                    </Badge>
                  </div>
                </Button>
                
                 {isCompanyExpanded && (
                   <div className="ml-6 mt-0.5">
                     <div className="space-y-0.5">
                  {Object.entries(services).map(([serviceName, serviceLinks]) => {
                    const serviceKey = `${companyId}-${serviceName}`;
                    const isServiceExpanded = expandedServices.has(serviceKey);
                    
                    return (
                      <div key={serviceKey}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start py-1 px-2 h-auto text-left hover:bg-slate-700"
                          onClick={() => toggleService(serviceKey)}
                        >
                          <div className="flex items-center gap-2 text-slate-300">
                            {isServiceExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <Globe className="h-4 w-4" />
                            <span className="truncate">{serviceName}</span>
                            <Badge variant="outline" className="ml-auto">
                              {serviceLinks.length}
                            </Badge>
                          </div>
                        </Button>
                        
                        {isServiceExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {serviceLinks.map((link) => {
                              const isHidden = visiblePasswords.has(link.id);
                              
                              return (
                                <div key={link.id} className="p-2 border border-slate-600 rounded-md bg-slate-800/50">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-slate-200 text-sm">
                                          {link.name}
                                        </h4>
                                        {link.url && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0"
                                            onClick={() => window.open(link.url, '_blank')}
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                      
                                      {link.url && (
                                        <p className="text-xs text-slate-400 mb-1 break-all">
                                          {link.url}
                                        </p>
                                      )}
                                      
                                      {link.username && (
                                        <p className="text-xs text-slate-300">
                                          <span className="font-medium">Usuário:</span> {link.username}
                                        </p>
                                      )}
                                      
                                      {link.password && (
                                        <p className="text-xs text-slate-300">
                                          <span className="font-medium">Senha:</span>{' '}
                                          {isHidden ? '••••••••' : link.password}
                                        </p>
                                      )}
                                      
                                      {link.email && (
                                        <div className="flex items-center gap-1 text-xs text-slate-300">
                                          <Mail className="h-3 w-3" />
                                          <span>{link.email}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {link.password && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 ml-2"
                                        onClick={() => togglePasswordVisibility(link.id)}
                                      >
                                        {isHidden ? (
                                          <Eye className="h-3 w-3" />
                                        ) : (
                                          <EyeOff className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {link.notes && (
                                    <div className="mt-2 pt-2 border-t border-slate-600">
                                      <p className="text-xs text-slate-400">
                                        {link.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                     })}
                     </div>
                   </div>
                 )}
               </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};