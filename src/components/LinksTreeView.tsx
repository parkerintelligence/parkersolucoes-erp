import { useState } from 'react';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from '@/hooks/useCompanies';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, ChevronRight, Building, ExternalLink, Eye, EyeOff,
  Globe, Mail, Server, Database, Cloud, Shield, Monitor, Settings, Code,
  Expand, Minimize2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const LinksTreeView = () => {
  const { data: passwords = [] } = usePasswords();
  const { data: companies = [] } = useCompanies();
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const links = passwords.filter(password => password.gera_link);

  const getServiceIcon = (service: string) => {
    const iconMap: Record<string, any> = {
      'Sistema': Code, 'Email': Mail, 'Hosting': Server, 'Database': Database,
      'Cloud': Cloud, 'Security': Shield, 'Monitoring': Monitor, 'Config': Settings
    };
    const IconComponent = iconMap[service] || Globe;
    return <IconComponent className="h-3.5 w-3.5" />;
  };

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, key: string) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setFn(next);
  };

  const organizeLinksTree = () => {
    const tree: Record<string, Record<string, any[]>> = {};
    links.forEach(link => {
      const cid = link.company_id || 'no-company';
      const svc = link.service || 'Sem categoria';
      if (!tree[cid]) tree[cid] = {};
      if (!tree[cid][svc]) tree[cid][svc] = [];
      tree[cid][svc].push(link);
    });
    return tree;
  };

  const linksTree = organizeLinksTree();

  const expandAll = () => {
    setExpandedCompanies(new Set(Object.keys(linksTree)));
    setExpandedServices(new Set(
      Object.entries(linksTree).flatMap(([cid, svcs]) =>
        Object.keys(svcs).map(s => `${cid}-${s}`)
      )
    ));
  };

  const handleOpenLink = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else toast({ title: "URL não encontrada", description: "Este link não possui uma URL válida.", variant: "destructive" });
  };

  if (links.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-dashed border-border p-8 text-center">
        <Building className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h3 className="text-sm font-medium mb-1 text-foreground">Nenhum link encontrado</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Configure senhas com "Gerar Link" ativado para visualizar na árvore organizacional.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <div className="flex gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={expandAll} className="h-7 text-xs gap-1.5">
          <Expand className="h-3 w-3" /> Expandir Tudo
        </Button>
        <Button variant="outline" size="sm" onClick={() => { setExpandedCompanies(new Set()); setExpandedServices(new Set()); }} className="h-7 text-xs gap-1.5">
          <Minimize2 className="h-3 w-3" /> Recolher Tudo
        </Button>
      </div>

      <div className="space-y-0.5">
        {Object.entries(linksTree).map(([companyId, services]) => {
          const company = companies.find(c => c.id === companyId);
          const isOpen = expandedCompanies.has(companyId);

          return (
            <Collapsible key={companyId} open={isOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start py-1 px-2 h-auto text-left hover:bg-muted/50"
                  onClick={() => toggle(expandedCompanies, setExpandedCompanies, companyId)}
                >
                  <div className="flex items-center gap-2 text-foreground">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <Building className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-sm">{company?.name || 'Sem empresa'}</span>
                    <Badge variant="outline" className="text-[10px] bg-muted/50 border-border">
                      {Object.values(services).flat().length} links
                    </Badge>
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="ml-6 mt-0.5">
                <div className="space-y-0.5">
                  {Object.entries(services).map(([serviceName, serviceLinks]) => {
                    const sKey = `${companyId}-${serviceName}`;
                    const sOpen = expandedServices.has(sKey);

                    return (
                      <Collapsible key={sKey} open={sOpen}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start py-1 px-2 h-auto text-left hover:bg-muted/50"
                            onClick={() => toggle(expandedServices, setExpandedServices, sKey)}
                          >
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {sOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              {getServiceIcon(serviceName)}
                              <span className="text-xs">{serviceName}</span>
                              <Badge variant="outline" className="text-[10px] bg-muted/30 border-border">
                                {serviceLinks.length}
                              </Badge>
                            </div>
                          </Button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="ml-6 mt-0.5">
                          <div className="space-y-0.5">
                            {serviceLinks.map((link: any) => {
                              const isPwVisible = visiblePasswords.has(link.id);
                              return (
                                <div key={link.id} className="p-2 bg-muted/30 rounded-md border border-border hover:border-primary/30 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0 flex items-center gap-2">
                                      <h4 className="font-medium text-foreground text-xs truncate">{link.name}</h4>
                                      {link.url && (
                                        <button
                                          onClick={() => handleOpenLink(link.url)}
                                          className="text-primary text-[11px] hover:underline truncate max-w-[200px]"
                                          title={link.url}
                                        >{link.url}</button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5 ml-2">
                                      <Button variant="ghost" size="sm" onClick={() => toggle(visiblePasswords, setVisiblePasswords, link.id)} className="h-6 w-6 p-0 hover:bg-muted">
                                        {isPwVisible ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleOpenLink(link.url)} className="h-6 w-6 p-0 hover:bg-muted text-primary">
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {isPwVisible && (
                                    <div className="space-y-0.5 mt-1 text-[11px]">
                                      {link.username && <p className="text-muted-foreground"><span className="opacity-60">Usuário:</span> <code className="bg-muted px-1 rounded text-foreground">{link.username}</code></p>}
                                      {link.password && <p className="text-muted-foreground"><span className="opacity-60">Senha:</span> <code className="bg-muted px-1 rounded text-foreground">{link.password}</code></p>}
                                      {link.notes && <p className="text-muted-foreground"><span className="opacity-60">Notas:</span> {link.notes}</p>}
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
    </div>
  );
};
