import { Network, ChevronDown, Check } from "lucide-react";
import { useMikrotikContext } from "@/contexts/MikrotikContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MikrotikHeaderSelector = () => {
  const { selectedClient, clients, selectClient } = useMikrotikContext();
  
  const activeClients = clients.filter(c => c.is_active);

  if (!selectedClient) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50">
        <Network className="h-4 w-4 text-blue-400" />
        <span className="text-white text-sm font-medium">{selectedClient.name}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 bg-slate-800 border-slate-700" align="start">
        <DropdownMenuLabel className="text-slate-400 text-xs uppercase tracking-wider">
          Clientes Ativos
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-700" />
        
        {activeClients.map((client) => (
          <DropdownMenuItem
            key={client.id}
            onClick={() => selectClient(client)}
            className="cursor-pointer focus:bg-slate-700/50 text-slate-300 hover:text-white"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-sm font-medium">{client.name}</p>
                  <p className="text-xs text-slate-500">{client.base_url}</p>
                </div>
              </div>
              {selectedClient.id === client.id && (
                <Check className="h-4 w-4 text-green-400" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
