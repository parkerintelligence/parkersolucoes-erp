import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ViewAnnotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annotation: {
    name: string;
    annotation: string;
    company?: string;
    service?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export const ViewAnnotationDialog = ({ open, onOpenChange, annotation }: ViewAnnotationDialogProps) => {
  const handleCopy = () => {
    const textToCopy = `${annotation.name}\n\n${annotation.annotation}${annotation.notes ? '\n\nObservações:\n' + annotation.notes : ''}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: "Copiado!",
        description: "Anotação copiada para a área de transferência.",
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a anotação.",
        variant: "destructive",
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Visualizar Anotação
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da anotação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com nome e badges */}
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {annotation.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {annotation.company && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  🏢 {annotation.company}
                </Badge>
              )}
              {annotation.service && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  ⚙️ {annotation.service}
                </Badge>
              )}
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Anotação Principal:
              </Label>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {annotation.annotation}
                </pre>
              </div>
            </div>

            {annotation.notes && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Observações:
                </Label>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {annotation.notes}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Informações de data */}
          {(annotation.created_at || annotation.updated_at) && (
            <div className="pt-4 border-t">
              <div className="text-xs text-gray-500 space-y-1">
                {annotation.created_at && (
                  <p>
                    <strong>Criado em:</strong> {new Date(annotation.created_at).toLocaleString('pt-BR')}
                  </p>
                )}
                {annotation.updated_at && annotation.updated_at !== annotation.created_at && (
                  <p>
                    <strong>Atualizado em:</strong> {new Date(annotation.updated_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Texto
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};