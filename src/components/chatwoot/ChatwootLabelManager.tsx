import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, X, Plus } from 'lucide-react';
import { useChatwootLabels } from '@/hooks/useChatwootLabels';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatwootLabelManagerProps {
  conversationId: string;
  currentLabels?: string[];
  integrationId?: string;
  mode?: 'full' | 'compact';
}

export const ChatwootLabelManager = ({ 
  conversationId, 
  currentLabels = [], 
  integrationId,
  mode = 'full' 
}: ChatwootLabelManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { labels: availableLabels, isLoadingLabels, addLabels, removeLabel } = useChatwootLabels(integrationId);

  const handleAddLabel = async (labelTitle: string) => {
    const labelsToAdd = currentLabels.includes(labelTitle) 
      ? currentLabels.filter(l => l !== labelTitle)
      : [...currentLabels, labelTitle];
    
    await addLabels.mutateAsync({ 
      conversationId, 
      labels: labelsToAdd 
    });
  };

  const handleRemoveLabel = async (labelTitle: string) => {
    await removeLabel.mutateAsync({ conversationId, label: labelTitle });
  };

  const getLabelColor = (labelTitle: string) => {
    const label = availableLabels.find(l => l.title === labelTitle);
    return label?.color || '#64748b';
  };

  // Compact mode - badges com cores vibrantes
  if (mode === 'compact') {
    if (currentLabels.length === 0) return null;
    
    const maxVisibleLabels = 3;
    const visibleLabels = currentLabels.slice(0, maxVisibleLabels);
    const remainingCount = currentLabels.length - maxVisibleLabels;

    return (
      <div className="flex items-center gap-1 flex-wrap">
        {visibleLabels.map((label, index) => {
          const color = getLabelColor(label);
          return (
            <Badge
              key={index}
              variant="outline"
              className="text-[10px] h-5 px-2 border-0 shadow-sm"
              style={{ 
                backgroundColor: color,
                color: '#fff'
              }}
            >
              {label}
            </Badge>
          );
        })}
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-700/80 border-slate-600 text-slate-200">
            +{remainingCount}
          </Badge>
        )}
      </div>
    );
  }

  // Full mode - com edição e cores fortes
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tag className="h-4 w-4 text-muted-foreground" />
      {currentLabels.map((label, index) => {
        const color = getLabelColor(label);
        // Calcular se a cor é escura ou clara para definir cor do texto
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const textColor = luminance > 0.5 ? '#000000' : '#FFFFFF';
        
        return (
          <Badge 
            key={index} 
            variant="outline" 
            className="text-xs h-6 px-2 gap-1.5 border-0 shadow-sm"
            style={{ 
              backgroundColor: `${color}60`,
              color: textColor,
              borderLeft: `3px solid ${color}`
            }}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: color }}
            />
            {label}
            <button
              onClick={() => handleRemoveLabel(label)}
              className="ml-1 hover:opacity-70 transition-opacity"
              disabled={removeLabel.isPending}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-5 px-2 text-xs"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Etiquetas</DialogTitle>
            <DialogDescription>
              Adicione ou remova etiquetas desta conversa
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-3">
              {isLoadingLabels ? (
                <p className="text-sm text-muted-foreground">Carregando etiquetas...</p>
              ) : availableLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma etiqueta disponível</p>
              ) : (
                availableLabels.map((label) => (
                  <div key={label.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`label-${label.id}`}
                      checked={currentLabels.includes(label.title)}
                      onCheckedChange={() => handleAddLabel(label.title)}
                      disabled={addLabels.isPending || removeLabel.isPending}
                    />
                    <label
                      htmlFor={`label-${label.id}`}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm">{label.title}</span>
                      {label.description && (
                        <span className="text-xs text-muted-foreground">
                          {label.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
