import React from 'react';
import { useCompanyLinks } from '@/hooks/useCompanyLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Building } from 'lucide-react';
import { LinksTreeView } from '@/components/LinksTreeView';

const Links = () => {
  const { links, isLoading } = useCompanyLinks();


  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Links Organizacionais</h1>
          <p className="text-muted-foreground">Visualize os links dos sistemas organizacionais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Visualização em Árvore</CardTitle>
            <CardDescription>
              Links organizados por empresa e categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinksTreeView />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {links?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  Nenhum link encontrado
                </h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Configure senhas com "Gerar Link" ativado para visualizá-las aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            links?.map((link: any) => (
              <Card key={link.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{link.name}</CardTitle>
                      {link.category && (
                        <Badge variant="secondary">{link.category}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {link.url && (
                        <button
                          onClick={() => window.open(link.url, '_blank')}
                          className="p-2 hover:bg-accent rounded-md transition-colors"
                          title="Abrir link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {link.description && (
                    <CardDescription>{link.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {link.url && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{link.url}</span>
                    </div>
                  )}
                  {link.username && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Usuário:</span> {link.username}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Links;