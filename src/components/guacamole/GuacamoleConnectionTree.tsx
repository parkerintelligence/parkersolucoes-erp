import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FolderOpen, Folder, Monitor, ChevronDown, ChevronRight, ExternalLink, Edit, Trash2, Search, Expand, Minimize2 } from 'lucide-react';
import { GuacamoleConnection } from '@/hooks/useGuacamoleAPI';
interface GuacamoleConnectionTreeProps {
  connections: GuacamoleConnection[];
  connectionGroups: any[];
  onConnect: (connection: GuacamoleConnection) => void;
  onEdit: (connection: GuacamoleConnection) => void;
  onDelete: (connectionId: string) => void;
  onDisconnect?: (connectionId: string) => void;
  isDeleting?: boolean;
}
interface ConnectionGroup {
  identifier: string;
  name: string;
  connections: GuacamoleConnection[];
}
export const GuacamoleConnectionTree = ({
  connections,
  connectionGroups,
  onConnect,
  onEdit,
  onDelete,
  onDisconnect,
  isDeleting
}: GuacamoleConnectionTreeProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Começar todos recolhidos
  const [searchFilter, setSearchFilter] = useState('');

  // Extrair grupo do nome da conexão (texto antes do primeiro hífen)
  const extractGroupFromConnectionName = (connectionName: string) => {
    const parts = connectionName.split(' - ');
    if (parts.length > 1) {
      return {
        groupName: parts[0].trim(),
        connectionDisplayName: parts.slice(1).join(' - ').trim()
      };
    }
    return {
      groupName: 'Conexões Gerais',
      connectionDisplayName: connectionName
    };
  };

  // Organizar conexões por grupo com filtro
  const organizedConnections = () => {
    const groups: Record<string, ConnectionGroup> = {};

    // Filtrar conexões baseado no texto de pesquisa
    const filteredConnections = connections.filter(connection => {
      if (!searchFilter.trim()) return true;
      
      const searchTerm = searchFilter.toLowerCase().trim();
      const { groupName, connectionDisplayName } = extractGroupFromConnectionName(connection.name);
      
      return (
        groupName.toLowerCase().includes(searchTerm) ||
        connectionDisplayName.toLowerCase().includes(searchTerm) ||
        connection.name.toLowerCase().includes(searchTerm)
      );
    });

    // Distribuir conexões pelos grupos baseado no nome
    filteredConnections.forEach(connection => {
      const { groupName } = extractGroupFromConnectionName(connection.name);
      
      // Criar grupo se não existir
      if (!groups[groupName]) {
        groups[groupName] = {
          identifier: groupName,
          name: groupName,
          connections: []
        };
      }

      groups[groupName].connections.push(connection);
    });

    // Filtrar grupos também pelo nome do grupo e remover grupos vazios
    const filteredGroups = Object.values(groups).filter(group => {
      return group.connections.length > 0;
    });

    console.log('📊 Final groups distribution:', filteredGroups.map(g => ({
      name: g.name,
      id: g.identifier,
      connectionCount: g.connections.length,
      connections: g.connections.map(c => c.name)
    })));

    return filteredGroups;
  };
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };
  const getProtocolColor = (protocol: string) => {
    const colors = {
      'rdp': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'vnc': 'bg-green-500/20 text-green-400 border-green-500/30',
      'ssh': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'telnet': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[protocol.toLowerCase()] || 'bg-slate-500/20 text-muted-foreground border-border/30';
  };
  const getConnectionStatus = (connection: GuacamoleConnection) => {
    // Lógica simplificada para status da conexão
    return connection.activeConnections > 0 ? 'Conectado' : 'Disponível';
  };

  const getStatusColor = (status: string) => {
    return status === 'Conectado' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400';
  };

  // Funções para expandir/recolher todos os grupos
  const expandAll = () => {
    const allGroupIds = organizedConnections().map(group => group.identifier);
    setExpandedGroups(new Set(allGroupIds));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const groups = organizedConnections();
  return <div className="space-y-4">
      {/* Controles superiores */}
      <div className="flex gap-4">
        {/* Campo de filtro/pesquisa */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar por grupo ou nome da conexão..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Botões de expandir/recolher */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Expand className="h-4 w-4 mr-2" />
            Expandir Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Recolher Todos
          </Button>
        </div>
      </div>

      {/* Lista de grupos e conexões */}
      <div className="space-y-2">
      {groups.map(group => <Card key={group.identifier} className="bg-card border-border">
          <div className="p-3">
            <Button variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-secondary" onClick={() => toggleGroup(group.identifier)}>
              <div className="flex items-center gap-2 text-left">
                {expandedGroups.has(group.identifier) ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                {expandedGroups.has(group.identifier) ? <FolderOpen className="h-4 w-4 text-yellow-400" /> : <Folder className="h-4 w-4 text-yellow-400" />}
                <span className="text-foreground font-medium">{group.name}</span>
                <Badge variant="secondary" className="ml-auto bg-secondary text-muted-foreground">
                  {group.connections.length}
                </Badge>
              </div>
            </Button>

            {expandedGroups.has(group.identifier) && <div className="mt-3">
                {group.connections.length === 0 ? <div className="ml-6 py-4 text-center text-slate-500 text-sm">
                    Nenhuma conexão neste grupo
                  </div> : <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {group.connections.map(connection => <Card key={connection.identifier} className="bg-secondary border-border min-w-0">
                      <CardContent className="p-3 bg-background rounded-xl">
                        <div className="space-y-2">
                          {/* Header com ícone e nome */}
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            <h4 className="text-sm font-medium text-foreground truncate flex-1">
                              {extractGroupFromConnectionName(connection.name).connectionDisplayName}
                            </h4>
                          </div>

                          {/* Botões de ação */}
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => onEdit(connection)} className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted hover:text-foreground">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDelete(connection.identifier)} disabled={isDeleting} className="h-6 w-6 p-0 text-muted-foreground hover:bg-red-600 hover:text-foreground">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Status e protocolo */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${getProtocolColor(connection.protocol)}`}>
                              {connection.protocol.toUpperCase()}
                            </Badge>
                            <Badge variant="secondary" className={`text-xs ${getStatusColor(getConnectionStatus(connection))}`}>
                              {getConnectionStatus(connection)}
                            </Badge>
                            {connection.activeConnections > 0 && onDisconnect && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDisconnect(connection.identifier)}
                                className="h-5 px-2 text-[9px] text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                Desconectar
                              </Button>
                            )}
                          </div>

                          {/* Botão conectar */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onConnect(connection)} 
                            className="w-full h-6 text-xs bg-green-600 hover:bg-green-700 border-green-600 text-foreground"
                          >
                            Conectar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>)}
                  </div>}
              </div>}
          </div>
        </Card>)}
      </div>
    </div>;
};
