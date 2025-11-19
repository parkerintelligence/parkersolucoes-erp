import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMikrotikAPI } from '@/hooks/useMikrotikAPI';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface MikrotikNATDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const MikrotikNATDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: MikrotikNATDialogProps) => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    chain: 'srcnat',
    action: 'masquerade',
    protocol: '',
    'src-address': '',
    'src-port': '',
    'dst-address': '',
    'dst-port': '',
    'to-addresses': '',
    'to-ports': '',
    'out-interface': '',
    comment: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Remover campos vazios
      const payload: any = { chain: formData.chain, action: formData.action };
      
      if (formData.protocol) payload.protocol = formData.protocol;
      if (formData['src-address']) payload['src-address'] = formData['src-address'];
      if (formData['src-port']) payload['src-port'] = formData['src-port'];
      if (formData['dst-address']) payload['dst-address'] = formData['dst-address'];
      if (formData['dst-port']) payload['dst-port'] = formData['dst-port'];
      if (formData['to-addresses']) payload['to-addresses'] = formData['to-addresses'];
      if (formData['to-ports']) payload['to-ports'] = formData['to-ports'];
      if (formData['out-interface']) payload['out-interface'] = formData['out-interface'];
      if (formData.comment) payload.comment = formData.comment;

      await callAPI('/ip/firewall/nat', 'POST', payload);
      
      toast({
        title: 'Sucesso',
        description: 'Regra NAT criada com sucesso',
      });
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        chain: 'srcnat',
        action: 'masquerade',
        protocol: '',
        'src-address': '',
        'src-port': '',
        'dst-address': '',
        'dst-port': '',
        'to-addresses': '',
        'to-ports': '',
        'out-interface': '',
        comment: '',
      });
    } catch (error) {
      console.error('Erro ao criar regra NAT:', error);
    }
  };

  const showToFields = formData.action === 'dst-nat' || formData.action === 'src-nat';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Regra NAT</DialogTitle>
          <DialogDescription>
            Crie uma nova regra de NAT para o MikroTik
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chain">Chain *</Label>
              <Select
                value={formData.chain}
                onValueChange={(value) => setFormData({ ...formData, chain: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="srcnat">Source NAT</SelectItem>
                  <SelectItem value="dstnat">Destination NAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Ação *</Label>
              <Select
                value={formData.action}
                onValueChange={(value) => setFormData({ ...formData, action: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masquerade">Masquerade</SelectItem>
                  <SelectItem value="dst-nat">Destination NAT</SelectItem>
                  <SelectItem value="src-nat">Source NAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protocol">Protocolo</Label>
            <Select
              value={formData.protocol}
              onValueChange={(value) => setFormData({ ...formData, protocol: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um protocolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tcp">TCP</SelectItem>
                <SelectItem value="udp">UDP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="src-address">Endereço de Origem</Label>
              <Input
                id="src-address"
                placeholder="Ex: 192.168.1.0/24"
                value={formData['src-address']}
                onChange={(e) => setFormData({ ...formData, 'src-address': e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="src-port">Porta de Origem</Label>
              <Input
                id="src-port"
                placeholder="Ex: 80"
                value={formData['src-port']}
                onChange={(e) => setFormData({ ...formData, 'src-port': e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dst-address">Endereço de Destino</Label>
              <Input
                id="dst-address"
                placeholder="Ex: 192.168.1.1"
                value={formData['dst-address']}
                onChange={(e) => setFormData({ ...formData, 'dst-address': e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dst-port">Porta de Destino</Label>
              <Input
                id="dst-port"
                placeholder="Ex: 443"
                value={formData['dst-port']}
                onChange={(e) => setFormData({ ...formData, 'dst-port': e.target.value })}
              />
            </div>
          </div>

          {showToFields && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="to-addresses">To Address</Label>
                <Input
                  id="to-addresses"
                  placeholder="Ex: 192.168.2.1"
                  value={formData['to-addresses']}
                  onChange={(e) => setFormData({ ...formData, 'to-addresses': e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to-ports">To Port</Label>
                <Input
                  id="to-ports"
                  placeholder="Ex: 8080"
                  value={formData['to-ports']}
                  onChange={(e) => setFormData({ ...formData, 'to-ports': e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="out-interface">Interface de Saída</Label>
            <Input
              id="out-interface"
              placeholder="Ex: ether1"
              value={formData['out-interface']}
              onChange={(e) => setFormData({ ...formData, 'out-interface': e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário</Label>
            <Textarea
              id="comment"
              placeholder="Descrição da regra NAT"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Regra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
