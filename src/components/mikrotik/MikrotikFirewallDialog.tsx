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

interface MikrotikFirewallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const MikrotikFirewallDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: MikrotikFirewallDialogProps) => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    chain: 'input',
    action: 'accept',
    protocol: '',
    'src-address': '',
    'src-port': '',
    'dst-address': '',
    'dst-port': '',
    'in-interface': '',
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
      if (formData['in-interface']) payload['in-interface'] = formData['in-interface'];
      if (formData['out-interface']) payload['out-interface'] = formData['out-interface'];
      if (formData.comment) payload.comment = formData.comment;

      await callAPI('/ip/firewall/filter', 'POST', payload);
      
      toast({
        title: 'Sucesso',
        description: 'Regra de firewall criada com sucesso',
      });
      
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        chain: 'input',
        action: 'accept',
        protocol: '',
        'src-address': '',
        'src-port': '',
        'dst-address': '',
        'dst-port': '',
        'in-interface': '',
        'out-interface': '',
        comment: '',
      });
    } catch (error) {
      console.error('Erro ao criar regra:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Regra de Firewall</DialogTitle>
          <DialogDescription>
            Crie uma nova regra de firewall para o MikroTik
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
                  <SelectItem value="input">Input</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="output">Output</SelectItem>
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
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="drop">Drop</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
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
                <SelectItem value="icmp">ICMP</SelectItem>
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
                placeholder="Ex: 80 ou 80-443"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="in-interface">Interface de Entrada</Label>
              <Input
                id="in-interface"
                placeholder="Ex: ether1"
                value={formData['in-interface']}
                onChange={(e) => setFormData({ ...formData, 'in-interface': e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="out-interface">Interface de Saída</Label>
              <Input
                id="out-interface"
                placeholder="Ex: ether2"
                value={formData['out-interface']}
                onChange={(e) => setFormData({ ...formData, 'out-interface': e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário</Label>
            <Textarea
              id="comment"
              placeholder="Descrição da regra"
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
