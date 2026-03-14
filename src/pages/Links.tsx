import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, ExternalLink, Search, Eye, EyeOff, LayoutGrid, TreePine, Building, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LinksTreeView } from '@/components/LinksTreeView';

const Links = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

  const { data: passwords = [], isLoading: passwordsLoading } = useQuery({
    queryKey: ['passwords-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .eq('gera_link', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['companies-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = passwordsLoading || companiesLoading;

  const filteredLinks = passwords.filter(link => {
    const company = companies.find(c => c.id === link.company_id);
    const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === 'all' || link.company_id === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const toggleCardVisibility = (linkId: string) => {
    setVisibleCards(prev => ({ ...prev, [linkId]: !prev[linkId] }));
  };

  const handleOpenLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({ title: "URL não encontrada", description: "Este link não possui uma URL válida.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground text-sm">Carregando links...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3 p-3">
        {/* Header compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Links de Acesso</h1>
              <p className="text-xs text-muted-foreground">Gerencie seus links de sistemas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {filteredLinks.length} links
            </Badge>
            <div className="flex border border-border rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7 p-0 rounded-none"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                className="h-7 w-7 p-0 rounded-none"
              >
                <TreePine className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros compactos */}
        <div className="bg-card rounded-lg p-2 border border-border">
          <div className="flex items-center gap-2 text-xs">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Buscar link, empresa ou usuário..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs bg-background border-border"
              />
            </div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="h-7 text-xs bg-background border border-border text-foreground rounded-md px-2"
            >
              <option value="all">Todas empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Conteúdo */}
        {viewMode === 'tree' ? (
          <LinksTreeView />
        ) : filteredLinks.length > 0 ? (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs h-8 text-muted-foreground font-medium">Nome</TableHead>
                  <TableHead className="text-xs h-8 text-muted-foreground font-medium">Empresa</TableHead>
                  <TableHead className="text-xs h-8 text-muted-foreground font-medium">URL</TableHead>
                  <TableHead className="text-xs h-8 text-muted-foreground font-medium">Serviço</TableHead>
                  <TableHead className="text-xs h-8 text-muted-foreground font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map(link => {
                  const company = companies.find(c => c.id === link.company_id);
                  const isVisible = visibleCards[link.id];

                  return (
                    <Tooltip key={link.id}>
                      <TooltipTrigger asChild>
                        <TableRow className="border-border hover:bg-muted/30 cursor-pointer">
                          <TableCell className="text-xs py-1.5 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                              {link.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs py-1.5 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Building className="h-3 w-3 shrink-0" />
                              {company?.name || 'Sem empresa'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs py-1.5">
                            {link.url ? (
                              <button
                                onClick={() => handleOpenLink(link.url)}
                                className="text-primary hover:underline truncate max-w-[200px] block text-left"
                                title={link.url}
                              >
                                {link.url}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-1.5">
                            {link.service ? (
                              <Badge variant="outline" className="text-[10px] bg-muted/50 border-border">
                                {link.service}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-1.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); toggleCardVisibility(link.id); }}
                                className="h-6 w-6 p-0 hover:bg-muted"
                              >
                                {isVisible ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleOpenLink(link.url); }}
                                className="h-6 w-6 p-0 hover:bg-muted text-primary"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="text-xs max-w-sm">
                        <div className="space-y-1">
                          {link.username && <p><span className="text-muted-foreground">Usuário:</span> {isVisible ? link.username : '••••••'}</p>}
                          {link.password && <p><span className="text-muted-foreground">Senha:</span> {isVisible ? link.password : '••••••'}</p>}
                          {link.notes && <p><span className="text-muted-foreground">Notas:</span> {link.notes}</p>}
                          {!link.username && !link.password && !link.notes && <p className="text-muted-foreground">Sem credenciais cadastradas</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-dashed border-border p-8">
            <div className="text-center text-muted-foreground">
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Link className="h-6 w-6 opacity-50" />
              </div>
              <h3 className="text-sm font-medium mb-1 text-foreground">Nenhum link encontrado</h3>
              <p className="text-xs max-w-md mx-auto">
                Configure senhas com "Gerar Link" ativado para visualizar os sistemas de acesso aqui.
              </p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Links;
