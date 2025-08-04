
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Wifi, 
  Plus, 
  Settings, 
  Shield,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

export interface UniFiNetwork {
  _id: string;
  name: string;
  x_password?: string;
  security: string;
  enabled: boolean;
  is_guest: boolean;
  usergroup_id?: string;
  wpa_mode?: string;
  wpa_enc?: string;
  vlan_enabled?: boolean;
  vlan?: number;
  site_id: string;
}

interface UniFiNetworkManagerProps {
  networks: UniFiNetwork[];
  loading?: boolean;
  onCreateNetwork: (networkData: any) => void;
  onUpdateNetwork: (networkId: string, networkData: any) => void;
  onDeleteNetwork: (networkId: string) => void;
  onToggleNetwork: (networkId: string, enabled: boolean) => void;
  selectedSiteId?: string;
}

export const UniFiNetworkManager: React.FC<UniFiNetworkManagerProps> = ({
  networks,
  loading = false,
  onCreateNetwork,
  onUpdateNetwork,
  onDeleteNetwork,
  onToggleNetwork,
  selectedSiteId
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<UniFiNetwork | null>(null);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  
  const [newNetwork, setNewNetwork] = useState({
    name: '',
    x_password: '',
    security: 'wpapsk',
    enabled: true,
    is_guest: false,
    vlan_enabled: false,
    vlan: 1
  });

  const handleCreateNetwork = () => {
    const networkData = {
      ...newNetwork,
      wpa_mode: 'wpa2',
      wpa_enc: 'ccmp',
      usergroup_id: newNetwork.is_guest ? 'guest' : 'default'
    };
    
    onCreateNetwork(networkData);
    setCreateDialogOpen(false);
    setNewNetwork({
      name: '',
      x_password: '',
      security: 'wpapsk',
      enabled: true,
      is_guest: false,
      vlan_enabled: false,
      vlan: 1
    });
  };

  const handleEditNetwork = (network: UniFiNetwork) => {
    setEditingNetwork(network);
    setEditDialogOpen(true);
  };

  const handleUpdateNetwork = () => {
    if (editingNetwork) {
      onUpdateNetwork(editingNetwork._id, editingNetwork);
      setEditDialogOpen(false);
      setEditingNetwork(null);
    }
  };

  const togglePasswordVisibility = (networkId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [networkId]: !prev[networkId]
    }));
  };

  const getSecurityBadge = (security: string) => {
    switch (security) {
      case 'wpapsk':
        return <Badge className="bg-green-900/20 text-green-400 border-green-600">WPA2-PSK</Badge>;
      case 'wpa3':
        return <Badge className="bg-blue-900/20 text-blue-400 border-blue-600">WPA3</Badge>;
      case 'open':
        return <Badge className="bg-red-900/20 text-red-400 border-red-600">Aberta</Badge>;
      default:
        return <Badge className="bg-gray-900/20 text-gray-400 border-gray-600">{security}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Gerenciamento de Redes Wi-Fi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
            <span className="ml-2 text-gray-400">Carregando redes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Gerenciamento de Redes Wi-Fi ({networks.length})
        </CardTitle>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Rede
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Criar Nova Rede Wi-Fi</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="network-name">Nome da Rede (SSID)</Label>
                <Input
                  id="network-name"
                  value={newNetwork.name}
                  onChange={(e) => setNewNetwork({...newNetwork, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Nome da rede Wi-Fi"
                />
              </div>
              
              <div>
                <Label htmlFor="network-password">Senha</Label>
                <Input
                  id="network-password"
                  type="password"
                  value={newNetwork.x_password}
                  onChange={(e) => setNewNetwork({...newNetwork, x_password: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Senha da rede"
                />
              </div>
              
              <div>
                <Label htmlFor="network-security">Tipo de Segurança</Label>
                <Select value={newNetwork.security} onValueChange={(value) => setNewNetwork({...newNetwork, security: value})}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="wpapsk">WPA2-PSK</SelectItem>
                    <SelectItem value="wpa3">WPA3</SelectItem>
                    <SelectItem value="open">Aberta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-guest"
                  checked={newNetwork.is_guest}
                  onCheckedChange={(checked) => setNewNetwork({...newNetwork, is_guest: checked})}
                />
                <Label htmlFor="is-guest">Rede para Convidados</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="vlan-enabled"
                  checked={newNetwork.vlan_enabled}
                  onCheckedChange={(checked) => setNewNetwork({...newNetwork, vlan_enabled: checked})}
                />
                <Label htmlFor="vlan-enabled">Usar VLAN</Label>
              </div>
              
              {newNetwork.vlan_enabled && (
                <div>
                  <Label htmlFor="vlan-id">VLAN ID</Label>
                  <Input
                    id="vlan-id"
                    type="number"
                    value={newNetwork.vlan}
                    onChange={(e) => setNewNetwork({...newNetwork, vlan: parseInt(e.target.value)})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateNetwork} className="bg-blue-600 hover:bg-blue-700">
                  Criar Rede
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {networks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Wifi className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma rede Wi-Fi encontrada</p>
            <p className="text-sm">Crie uma nova rede para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                  <TableHead className="text-gray-300">Nome (SSID)</TableHead>
                  <TableHead className="text-gray-300">Senha</TableHead>
                  <TableHead className="text-gray-300">Segurança</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">VLAN</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networks.map((network) => (
                  <TableRow key={network._id} className="border-gray-700 hover:bg-gray-800/30">
                    <TableCell className="font-medium text-gray-200">{network.name}</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {showPasswords[network._id] ? network.x_password || 'N/A' : '••••••••'}
                        </span>
                        {network.x_password && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => togglePasswordVisibility(network._id)}
                            className="h-6 w-6 p-0"
                          >
                            {showPasswords[network._id] ? 
                              <EyeOff className="h-3 w-3" /> : 
                              <Eye className="h-3 w-3" />
                            }
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getSecurityBadge(network.security)}</TableCell>
                    <TableCell>
                      <Badge className={network.enabled ? 
                        'bg-green-900/20 text-green-400 border-green-600' : 
                        'bg-red-900/20 text-red-400 border-red-600'
                      }>
                        {network.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={network.is_guest ? 
                        'bg-orange-900/20 text-orange-400 border-orange-600' : 
                        'bg-blue-900/20 text-blue-400 border-blue-600'
                      }>
                        {network.is_guest ? 'Convidados' : 'Principal'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {network.vlan_enabled ? `VLAN ${network.vlan}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleNetwork(network._id, !network.enabled)}
                          className="border-gray-600 text-gray-200 hover:bg-gray-700"
                        >
                          {network.enabled ? 
                            <PowerOff className="h-3 w-3" /> : 
                            <Power className="h-3 w-3" />
                          }
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditNetwork(network)}
                          className="border-gray-600 text-gray-200 hover:bg-gray-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteNetwork(network._id)}
                          className="border-gray-600 text-gray-200 hover:bg-gray-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Edit Network Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Editar Rede Wi-Fi</DialogTitle>
          </DialogHeader>
          {editingNetwork && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-network-name">Nome da Rede (SSID)</Label>
                <Input
                  id="edit-network-name"
                  value={editingNetwork.name}
                  onChange={(e) => setEditingNetwork({...editingNetwork, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-network-password">Senha</Label>
                <Input
                  id="edit-network-password"
                  type="password"
                  value={editingNetwork.x_password || ''}
                  onChange={(e) => setEditingNetwork({...editingNetwork, x_password: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is-guest"
                  checked={editingNetwork.is_guest}
                  onCheckedChange={(checked) => setEditingNetwork({...editingNetwork, is_guest: checked})}
                />
                <Label htmlFor="edit-is-guest">Rede para Convidados</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateNetwork} className="bg-blue-600 hover:bg-blue-700">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
