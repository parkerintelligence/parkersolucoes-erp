import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface IPAddress {
  ".id": string;
  address: string;
  interface?: string;
  network?: string;
  disabled?: string;
  dynamic?: string;
  invalid?: string;
  comment?: string;
}

interface AddressFormData {
  address: string;
  interface: string;
  comment: string;
  disabled: boolean;
}

interface MikrotikAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: IPAddress | null;
}

export const MikrotikAddressDialog = ({ open, onOpenChange, address }: MikrotikAddressDialogProps) => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AddressFormData>({
    defaultValues: {
      address: "",
      interface: "",
      comment: "",
      disabled: false,
    },
  });

  const selectedInterface = watch("interface");
  const disabled = watch("disabled");

  // Buscar interfaces disponíveis
  const { data: interfaces = [] } = useQuery({
    queryKey: ["mikrotik-interfaces"],
    queryFn: async () => {
      const result = await callAPI("/interface", "GET");
      return Array.isArray(result) ? result : [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (address) {
      reset({
        address: address.address,
        interface: address.interface || "",
        comment: address.comment || "",
        disabled: address.disabled === "true",
      });
    } else {
      reset({
        address: "",
        interface: "",
        comment: "",
        disabled: false,
      });
    }
  }, [address, reset]);

  const mutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const payload: any = {
        address: data.address,
        interface: data.interface,
        disabled: data.disabled ? "true" : "false",
      };

      if (data.comment) payload.comment = data.comment;

      if (address) {
        await callAPI(`/ip/address/${address[".id"]}`, "PATCH", payload);
      } else {
        await callAPI("/ip/address", "POST", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mikrotik-ip-addresses"] });
      toast({
        title: "Sucesso",
        description: address ? "Endereço IP atualizado com sucesso" : "Endereço IP criado com sucesso",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar endereço IP",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddressFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{address ? "Editar Endereço IP" : "Novo Endereço IP"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço IP com CIDR *</Label>
            <Input
              id="address"
              {...register("address", {
                required: "Endereço é obrigatório",
                pattern: {
                  value: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/,
                  message: "Formato inválido. Use: 192.168.1.1/24",
                },
              })}
              placeholder="192.168.1.1/24"
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            <p className="text-xs text-muted-foreground">Exemplo: 192.168.1.1/24</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interface">Interface *</Label>
            <Select value={selectedInterface} onValueChange={(value) => setValue("interface", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma interface" />
              </SelectTrigger>
              <SelectContent>
                {interfaces.map((iface: any) => (
                  <SelectItem key={iface[".id"]} value={iface.name}>
                    {iface.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.interface && <p className="text-sm text-destructive">{errors.interface.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário</Label>
            <Textarea
              id="comment"
              {...register("comment")}
              placeholder="Descrição do endereço IP"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="disabled"
              checked={disabled}
              onCheckedChange={(checked) => setValue("disabled", checked)}
            />
            <Label htmlFor="disabled">Desabilitado</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
