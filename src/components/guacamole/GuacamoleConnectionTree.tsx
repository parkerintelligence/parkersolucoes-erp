import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, Folder, Monitor, ChevronDown, ChevronRight, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { GuacamoleConnection } from '@/hooks/useGuacamoleAPI';
interface GuacamoleConnectionTreeProps {
  connections: GuacamoleConnection[];
  connectionGroups: any[];
  onConnect: (connection: GuacamoleConnection) => void;
  onEdit: (connection: GuacamoleConnection) => void;
  onDelete: (connectionId: string) => void;
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
  isDeleting
}: GuacamoleConnectionTreeProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['general']));

  // Organizar conexões por grupo
  const organizedConnections = () => {
    const groups: Record<string, ConnectionGroup> = {};

    // Primeiro, criar grupos baseados nos dados do Guacamole
    connectionGroups.forEach(group => {
      groups[group.identifier] = {
        identifier: group.identifier,
        name: group.name || group.identifier,
        connections: []
      };
    });

    // Grupo padrão para conexões sem grupo específico
    groups['general'] = {
      identifier: 'general',
      name: 'Grupo de Conexão Geral',
      connections: []
    };

    // Distribuir conexões pelos grupos
    connections.forEach(connection => {
      const groupId = (connection as any).parentIdentifier || 'general';
      if (!groups[groupId]) {
        groups[groupId] = {
          identifier: groupId,
          name: `Grupo ${groupId}`,
          connections: []
        };
      }
      groups[groupId].connections.push(connection);
    });

    // Remover grupos vazios (exceto o geral)
    return Object.values(groups).filter(group => group.connections.length > 0 || group.identifier === 'general');
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
    return colors[protocol.toLowerCase()] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };
  const getConnectionStatus = (connection: GuacamoleConnection) => {
    // Lógica simplificada para status da conexão
    return connection.activeConnections > 0 ? 'Conectado' : 'Disponível';
  };
  const getStatusColor = (status: string) => {
    return status === 'Conectado' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400';
  };
  const groups = organizedConnections();
  return <div className="space-y-2">
      {groups.map(group => <Card key={group.identifier} className="bg-slate-800 border-slate-700">
          <div className="p-3">
            <Button variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-slate-700" onClick={() => toggleGroup(group.identifier)}>
              <div className="flex items-center gap-2 text-left">
                {expandedGroups.has(group.identifier) ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                {expandedGroups.has(group.identifier) ? <FolderOpen className="h-4 w-4 text-yellow-400" /> : <Folder className="h-4 w-4 text-yellow-400" />}
                <span className="text-white font-medium">{group.name}</span>
                <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-300">
                  {group.connections.length}
                </Badge>
              </div>
            </Button>

            {expandedGroups.has(group.identifier) && <div className="mt-3 space-y-2">
                {group.connections.length === 0 ? <div className="ml-6 py-4 text-center text-slate-500 text-sm">
                    Nenhuma conexão neste grupo
                  </div> : group.connections.map(connection => <Card key={connection.identifier} className="ml-6 bg-slate-700 border-slate-600">
                      <CardContent className="p-3 bg-gray-900 rounded">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Monitor className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white truncate">
                                {connection.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onConnect(connection)}
                                  className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700 border-green-600 text-white"
                                >
                                  Conectar
                                </Button>
                                <Badge variant="outline" className={`text-xs ${getProtocolColor(connection.protocol)}`}>
                                  {connection.protocol.toUpperCase()}
                                </Badge>
                                <Badge variant="secondary" className={`text-xs ${getStatusColor(getConnectionStatus(connection))}`}>
                                  {getConnectionStatus(connection)}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-slate-50">
                            <Button variant="ghost" size="sm" onClick={() => onConnect(connection)} className="h-7 w-7 p-0 hover:bg-slate-600">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(connection)} className="h-7 w-7 p-0 hover:bg-slate-600">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDelete(connection.identifier)} disabled={isDeleting} className="h-7 w-7 p-0 hover:bg-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
              </div>}
          </div>
        </Card>)}
    </div>;
};