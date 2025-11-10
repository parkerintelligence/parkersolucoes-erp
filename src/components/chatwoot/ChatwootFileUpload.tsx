import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatwootFileUploadProps {
  conversationId: string;
  onUploadComplete?: () => void;
}

export const ChatwootFileUpload = ({ conversationId, onUploadComplete }: ChatwootFileUploadProps) => {
  const handleFileSelect = () => {
    // Placeholder for future implementation
    // This would handle file upload to Chatwoot
    toast({
      title: "Em desenvolvimento",
      description: "Upload de arquivos estará disponível em breve.",
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleFileSelect}
      className="h-9 w-9 text-slate-300 hover:bg-slate-700 hover:text-white"
      title="Anexar arquivo"
    >
      <Paperclip className="h-4 w-4" />
    </Button>
  );
};
