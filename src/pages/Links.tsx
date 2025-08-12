import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link, ExternalLink, Search, Eye, EyeOff, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { QuerySafeWrapper } from '@/components/QuerySafeWrapper';

const Links = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>({});

  // Buscar senhas que geram links
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

  // Buscar empresas
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

  // Filtrar links
  const filteredLinks = passwords.filter(link => {
    const company = companies.find(c => c.id === link.company_id);
    const matchesSearch = link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompany === '' || selectedCompany === 'all' || link.company_id === selectedCompany;
    return matchesSearch && matchesCompany;
  });

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-muted-foreground">Carregando links...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Links de Acesso</h1>
          <p className="text-slate-400 text-sm">Gerencie seus links de sistemas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center gap-3 text-xs">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-slate-400" />
            <Input 
              placeholder="Buscar..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-7 h-7 text-xs bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" 
            />
          </div>
          
          <select 
            value={selectedCompany} 
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="h-7 w-32 text-xs bg-slate-700 border-slate-600 text-white rounded px-2"
          >
            <option value="all">Todas</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Links */}
      <div className="mt-4">
        {filteredLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLinks.map(link => {
              const company = companies.find(c => c.id === link.company_id);
              const isVisible = visibleCards[link.id];
              
              return (
                <Card key={link.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                  <CardContent className="p-4">
                    {/* Header do card */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-blue-400">
                        <Link className="h-4 w-4" />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleCardVisibility(link.id)} 
                        className="h-6 w-6 p-0 border-slate-600 hover:bg-slate-700"
                      >
                        {isVisible ? <EyeOff className="h-3 w-3 text-slate-400" /> : <Eye className="h-3 w-3 text-slate-400" />}
                      </Button>
                    </div>

                    {/* Título e empresa */}
                    <div className="space-y-2 mb-3">
                      <h3 className="font-medium text-white text-sm">{link.name}</h3>
                      <p className="text-slate-400 text-xs">{company?.name || 'Sem empresa'}</p>
                      {link.url && (
                        <p className="text-blue-400 text-xs truncate" title={link.url}>
                          {link.url}
                        </p>
                      )}
                    </div>

                    {/* Credenciais (se visível) */}
                    {isVisible && (
                      <div className="space-y-1 mb-3 text-xs">
                        {link.username && (
                          <p className="text-slate-400">
                            <span className="text-slate-500">User:</span> {link.username}
                          </p>
                        )}
                        {link.password && (
                          <p className="text-slate-400">
                            <span className="text-slate-500">Pass:</span> {link.password}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Botão para abrir link */}
                    <div className="flex justify-center">
                      <Button 
                        className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white" 
                        onClick={() => handleOpenLink(link.url)}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Abrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-slate-600 bg-slate-800">
            <CardContent className="p-8">
              <div className="text-center text-slate-400">
                <div className="bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Link className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-white">
                  Nenhum link encontrado
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Configure senhas com "Gerar Link" ativado para visualizar os sistemas de acesso aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const SafeLinks = () => {
  return (
    <QuerySafeWrapper>
      <Links />
    </QuerySafeWrapper>
  );
};

export default SafeLinks;