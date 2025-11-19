import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useMikrotikWhatsApp } from "@/hooks/useMikrotikWhatsApp";

interface MikrotikWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gridTitle: string;
  data: any[];
  summary: string;
  columns?: { key: string; label: string; formatter?: (val: any) => string }[];
}

export const MikrotikWhatsAppDialog = ({
  open,
  onOpenChange,
  gridTitle,
  data,
  summary,
  columns
}: MikrotikWhatsAppDialogProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const { formatMessage, sendMessage, sending } = useMikrotikWhatsApp();

  const message = formatMessage({
    gridTitle,
    data,
    summary,
    includeDetails: true,
    columns
  });

  const handlePhoneChange = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica máscara brasileira
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 2) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      }
      if (numbers.length > 7) {
        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
      setPhoneNumber(formatted);
    }
  };

  const handleSend = async () => {
    try {
      await sendMessage(phoneNumber, message);
      onOpenChange(false);
      setPhoneNumber("");
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const isValidPhone = phoneNumber.replace(/\D/g, '').length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar via WhatsApp</DialogTitle>
          <DialogDescription>
            Envie o relatório de {gridTitle} para um número de WhatsApp
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número do WhatsApp</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              maxLength={15}
            />
            <p className="text-sm text-muted-foreground">
              Digite o número com DDD (apenas números)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview">Preview da Mensagem</Label>
            <Textarea
              id="preview"
              value={message}
              readOnly
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isValidPhone || sending}
          >
            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
