import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChatwootAgents } from '@/hooks/useChatwootAgents';
import { User, Loader2 } from 'lucide-react';

interface ChatwootAgentSelectorProps {
  conversationId: string;
  currentAgentId?: number;
}

export const ChatwootAgentSelector = ({ conversationId, currentAgentId }: ChatwootAgentSelectorProps) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(currentAgentId?.toString() || '');
  const { agents, isLoading, assignAgent } = useChatwootAgents();

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    await assignAgent.mutateAsync({
      conversationId,
      agentId: parseInt(selectedAgentId)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando agentes...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
        <SelectTrigger className="w-[200px] h-8">
          <SelectValue placeholder="Selecionar agente">
            {selectedAgentId ? (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span className="text-xs">
                  {agents.find(a => a.id.toString() === selectedAgentId)?.name}
                </span>
              </div>
            ) : (
              'Selecionar agente'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id.toString()}>
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span>{agent.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({agent.availability_status})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedAgentId && selectedAgentId !== currentAgentId?.toString() && (
        <Button
          size="sm"
          onClick={handleAssign}
          disabled={assignAgent.isPending}
        >
          {assignAgent.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            'Atribuir'
          )}
        </Button>
      )}
    </div>
  );
};
