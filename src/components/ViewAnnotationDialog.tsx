import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
      <DialogContent className="sm:max-w-[90vw] lg:max-w-5xl max-h-[95vh] overflow-y-auto bg-card border-border p-4">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-2 text-foreground text-sm">
            <Eye className="h-4 w-4 text-primary" />
            {annotation.name}
            {annotation.company && (
              <Badge variant="outline" className="bg-secondary text-primary border-border text-[10px] ml-2">
                🏢 {annotation.company}
              </Badge>
            )}
            {annotation.service && (
              <Badge variant="outline" className="bg-secondary text-accent border-border text-[10px]">
                ⚙️ {annotation.service}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-[11px]">
            {annotation.created_at && <>Criado: {new Date(annotation.created_at).toLocaleString('pt-BR')}</>}
            {annotation.updated_at && annotation.updated_at !== annotation.created_at && <> · Atualizado: {new Date(annotation.updated_at).toLocaleString('pt-BR')}</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div>
            <Label className="text-[11px] font-medium text-muted-foreground mb-0.5 block">Anotação:</Label>
            <div className="p-2 bg-secondary/50 rounded-md border border-border">
              <pre className="whitespace-pre-wrap text-[11px] text-foreground font-mono leading-snug break-words">{annotation.annotation}</pre>
            </div>
          </div>
          {annotation.notes && (
            <div>
              <Label className="text-[11px] font-medium text-muted-foreground mb-0.5 block">Observações:</Label>
              <div className="p-2 bg-secondary/50 rounded-md border border-border">
                <pre className="whitespace-pre-wrap text-[11px] text-muted-foreground font-mono leading-snug break-words">{annotation.notes}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs">
            <Copy className="mr-1.5 h-3 w-3" /> Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-7 text-xs">
            <X className="mr-1.5 h-3 w-3" /> Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
