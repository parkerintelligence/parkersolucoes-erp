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
      <DialogContent className="sm:max-w-3xl max-h-[95vh] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Eye className="h-5 w-5 text-blue-400" />
            Visualizar Anotação
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Detalhes completos da anotação
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Header compacto */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-700 pb-2">
            <h2 className="text-base font-semibold text-white truncate">{annotation.name}</h2>
            <div className="flex gap-1.5 flex-shrink-0">
              {annotation.company && (
                <Badge variant="outline" className="bg-gray-800 text-blue-300 border-gray-600 text-[10px]">
                  🏢 {annotation.company}
                </Badge>
              )}
              {annotation.service && (
                <Badge variant="outline" className="bg-gray-800 text-purple-300 border-gray-600 text-[10px]">
                  ⚙️ {annotation.service}
                </Badge>
              )}
            </div>
          </div>

          {/* Conteúdo principal - flex grow para ocupar espaço */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-400 mb-1 block">Anotação:</Label>
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                <pre className="whitespace-pre-wrap text-xs text-white font-mono leading-relaxed">{annotation.annotation}</pre>
              </div>
            </div>
            {annotation.notes && (
              <div>
                <Label className="text-xs font-medium text-gray-400 mb-1 block">Observações:</Label>
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                  <pre className="whitespace-pre-wrap text-xs text-gray-200 leading-relaxed">{annotation.notes}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer compacto */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="text-[10px] text-gray-500">
              {annotation.created_at && <>Criado: {new Date(annotation.created_at).toLocaleString('pt-BR')}</>}
              {annotation.updated_at && annotation.updated_at !== annotation.created_at && <> · Atualizado: {new Date(annotation.updated_at).toLocaleString('pt-BR')}</>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="text-blue-300 hover:text-blue-200 border-gray-600 hover:bg-gray-800 bg-gray-900 h-7 text-xs">
                <Copy className="mr-1.5 h-3 w-3" /> Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-white border-gray-600 hover:bg-gray-800 bg-gray-900 h-7 text-xs">
                <X className="mr-1.5 h-3 w-3" /> Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};