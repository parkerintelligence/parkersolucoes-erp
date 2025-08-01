
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GuacamoleConnection } from '@/hooks/useGuacamoleAPI';

interface GuacamoleConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: GuacamoleConnection | null;
  onSave: (connectionData: Partial<GuacamoleConnection>) => void;
  isSaving?: boolean;
}

export const GuacamoleConnectionDialog = ({
  open,
  onOpenChange,
  connection,
  onSave,
  isSaving = false
}: GuacamoleConnectionDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    protocol: 'rdp',
    hostname: '',
    port: '',
    username: '',
    password: '',
    domain: '',
    security: '',
    ignoreServerCert: false
  });

  useEffect(() => {
    if (connection) {
      // Mapear corretamente os dados da conexão para edição
      const params = connection.parameters || {};
      setFormData({
        name: connection.name || '',
        protocol: connection.protocol || 'rdp',
        hostname: params.hostname || '',
        port: params.port || '',
        username: params.username || '',
        password: params.password || '',
        domain: params.domain || '',
        security: params.security || '',
        ignoreServerCert: params['ignore-server-cert'] === 'true' || params['ignore-server-cert'] === true
      });
    } else {
      // Reset form for new connection
      setFormData({
        name: '',
        protocol: 'rdp',
        hostname: '',
        port: '',
        username: '',
        password: '',
        domain: '',
        security: '',
        ignoreServerCert: false
      });
    }
  }, [connection, open]);

  const handleSave = () => {
    const connectionData: Partial<GuacamoleConnection> = {
      name: formData.name,
      protocol: formData.protocol,
      parameters: {
        hostname: formData.hostname,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        domain: formData.domain,
        security: formData.security,
        'ignore-server-cert': formData.ignoreServerCert.toString()
      }
    };

    if (connection) {
      connectionData.identifier = connection.identifier;
    }

    onSave(connectionData);
  };

  const getPortPlaceholder = () => {
    switch (formData.protocol) {
      case 'rdp': return '3389';
      case 'vnc': return '5900';
      case 'ssh': return '22';
      case 'telnet': return '23';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {connection ? 'Editar Conexão' : 'Nova Conexão'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Nome da Conexão *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome descritivo para a conexão"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="protocol" className="text-white">Protocolo *</Label>
            <Select
              value={formData.protocol}
              onValueChange={(value) => setFormData({ ...formData, protocol: value })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="rdp" className="text-white hover:bg-slate-600">RDP (Remote Desktop)</SelectItem>
                <SelectItem value="vnc" className="text-white hover:bg-slate-600">VNC (Virtual Network Computing)</SelectItem>
                <SelectItem value="ssh" className="text-white hover:bg-slate-600">SSH (Secure Shell)</SelectItem>
                <SelectItem value="telnet" className="text-white hover:bg-slate-600">Telnet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="hostname" className="text-white">Hostname/IP *</Label>
              <Input
                id="hostname"
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                placeholder="192.168.1.100"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <Label htmlFor="port" className="text-white">Porta</Label>
              <Input
                id="port"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                placeholder={getPortPlaceholder()}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="username" className="text-white">Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          {formData.protocol === 'rdp' && (
            <div>
              <Label htmlFor="domain" className="text-white">Domínio</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="DOMAIN"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.hostname || isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? 'Salvando...' : connection ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
