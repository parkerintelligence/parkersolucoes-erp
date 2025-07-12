import React, { useState } from 'react';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Code
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
        <div className="space-y-2">
          {Object.entries(linksTree).map(([companyId, services]) => {
            const company = companies.find(c => c.id === companyId);
            const companyName = company?.name || 'Sem empresa';
            const isCompanyExpanded = expandedCompanies.has(companyId);
            
            return (
              <Collapsible key={companyId} open={isCompanyExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto text-left hover:bg-slate-700"
                    onClick={() => toggleCompany(companyId)}
                  >
                    <div className="flex items-center gap-2 text-white">
                      {isCompanyExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Building className="h-4 w-4 text-blue-400" />
                      <span className="font-medium">{companyName}</span>
                      <Badge variant="outline" className="bg-slate-700 text-slate-300 text-xs">
                        {Object.values(services).flat().length} links
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="ml-6 mt-1">
                  <div className="space-y-1">
                    {Object.entries(services).map(([serviceName, serviceLinks]) => {
                      const serviceKey = `${companyId}-${serviceName}`;
                      const isServiceExpanded = expandedServices.has(serviceKey);
                      
                      return (
                        <Collapsible key={serviceKey} open={isServiceExpanded}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start p-2 h-auto text-left hover:bg-slate-700"
                              onClick={() => toggleService(serviceKey)}
                            >
                              <div className="flex items-center gap-2 text-slate-300">
                                {isServiceExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                                {getServiceIcon(serviceName)}
                                <span className="text-sm">{serviceName}</span>
                                <Badge variant="outline" className="bg-slate-600 text-slate-400 text-xs">
                                  {serviceLinks.length}
                                </Badge>
                              </div>
                            </Button>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="ml-6 mt-1">
                            <div className="space-y-2">
                              {serviceLinks.map(link => {
                                const isPasswordVisible = visiblePasswords.has(link.id);
                                
                                return (
                                  <div
                                    key={link.id}
                                    className="p-3 bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium text-white text-sm truncate">
                                            {link.name}
                                          </h4>
                                          {link.url && (
                                            <button
                                              onClick={() => handleOpenLink(link.url)}
                                              className="text-blue-400 text-xs hover:text-blue-300 truncate max-w-xs cursor-pointer hover:underline"
                                              title={link.url}
                                            >
                                              {link.url}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 ml-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => togglePasswordVisibility(link.id)}
                                          className="h-6 w-6 p-0 hover:bg-slate-600"
                                        >
                                          {isPasswordVisible ? (
                                            <EyeOff className="h-3 w-3 text-slate-400" />
                                          ) : (
                                            <Eye className="h-3 w-3 text-slate-400" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenLink(link.url)}
                                          className="h-6 w-6 p-0 hover:bg-slate-600 text-blue-400"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {isPasswordVisible && (
                                      <div className="space-y-1 text-xs">
                                        {link.username && (
                                          <p className="text-slate-400">
                                            <span className="text-slate-500">Usuário:</span>{' '}
                                            <code className="bg-slate-600 px-1 rounded">{link.username}</code>
                                          </p>
                                        )}
                                        {link.password && (
                                          <p className="text-slate-400">
                                            <span className="text-slate-500">Senha:</span>{' '}
                                            <code className="bg-slate-600 px-1 rounded">{link.password}</code>
                                          </p>
                                        )}
                                        {link.notes && (
                                          <p className="text-slate-400">
                                            <span className="text-slate-500">Notas:</span>{' '}
                                            {link.notes}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};