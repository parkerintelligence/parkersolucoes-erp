import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag } from 'lucide-react';

interface ChatwootLabelManagerProps {
  conversationId: string;
  currentLabels?: string[];
}

export const ChatwootLabelManager = ({ conversationId, currentLabels = [] }: ChatwootLabelManagerProps) => {
  // Placeholder for future implementation
  // This would fetch available labels from Chatwoot API and allow adding/removing them
  
  if (currentLabels.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tag className="h-4 w-4 text-muted-foreground" />
      {currentLabels.map((label, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {label}
        </Badge>
      ))}
    </div>
  );
};
