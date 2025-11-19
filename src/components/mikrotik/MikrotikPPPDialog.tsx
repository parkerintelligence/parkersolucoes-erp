import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMikrotikAPI } from "@/hooks/useMikrotikAPI";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface PPPSecret {
  ".id": string;
  name: string;
  password?: string;
  service?: string;
  "local-address"?: string;
  "remote-address"?: string;
  profile?: string;
  disabled?: string;
  comment?: string;
}

interface PPPFormData {
  name: string;
  password: string;
  service: string;
  "local-address": string;
  "remote-address": string;
  profile: string;
  comment: string;
  disabled: boolean;
}

interface MikrotikPPPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: PPPSecret | null;
}

export const MikrotikPPPDialog = ({ open, onOpenChange, secret }: MikrotikPPPDialogProps) => {
  const { callAPI, loading } = useMikrotikAPI();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PPPFormData>({
    defaultValues: {
      name: "",
      password: "",
      service: "pptp",
      "local-address": "",
      "remote-address": "",
      profile: "default",
      comment: "",
      disabled: false,
    },
  });

  const service = watch("service");
  const disabled = watch("disabled");

  useEffect(() => {
    if (secret) {
      reset({
        name: secret.name,
        password: secret.password || "",
        service: secret.service || "pptp",
        "local-address": secret["local-address"] || "",
        "remote-address": secret["remote-address"] || "",
        profile: secret.profile || "default",
        comment: secret.comment || "",
        disabled: secret.disabled === "true",
      });
    } else {
      reset({
        name: "",
        password: "",
        service: "pptp",
        "local-address": "",
        "remote-address": "",
        profile: "default",
        comment: "",
        disabled: false,
      });
    }
  }, [secret, reset]);

  const mutation = useMutation({
    mutationFn: async (data: PPPFormData) => {
      const payload: any = {
        name: data.name,
        password: data.password,
        service: data.service,
        profile: data.profile,
        disabled: data.disabled ? "true" : "false",
      };

      if (data["local-address"]) payload["local-address"] = data["local-address"];
      if (data["remote-address"]) payload["remote-address"] = data["remote-address"];
      if (data.comment) payload.comment = data.comment;

      if (secret) {
        await callAPI(`/ppp/secret/${secret[".id"]}`, "PATCH", payload);
      } else {
        await callAPI("/ppp/secret", "POST", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mikrotik-ppp-secrets"] });
      toast({
        title: "Sucesso",
        description: secret ? "Usuário VPN atualizado com sucesso" : "Usuário VPN criado com sucesso",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário VPN",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PPPFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{secret ? "Editar Usuário VPN" : "Novo Usuário VPN"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Usuário *</Label>
              <Input
                id="name"
                {...register("name", { required: "Nome é obrigatório" })}
                placeholder="usuario"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                {...register("password", { required: "Senha é obrigatória" })}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service">Serviço *</Label>
              <Select value={service} onValueChange={(value) => setValue("service", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pptp">PPTP</SelectItem>
                  <SelectItem value="l2tp">L2TP</SelectItem>
                  <SelectItem value="sstp">SSTP</SelectItem>
                  <SelectItem value="pppoe">PPPoE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">Perfil</Label>
              <Input
                id="profile"
                {...register("profile")}
                placeholder="default"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="local-address">IP Local (Servidor)</Label>
              <Input
                id="local-address"
                {...register("local-address", {
                  pattern: {
                    value: /^(\d{1,3}\.){3}\d{1,3}$/,
                    message: "IP inválido",
                  },
                })}
                placeholder="10.0.0.1"
              />
              {errors["local-address"] && <p className="text-sm text-destructive">{errors["local-address"].message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="remote-address">IP Remoto (Cliente)</Label>
              <Input
                id="remote-address"
                {...register("remote-address", {
                  pattern: {
                    value: /^(\d{1,3}\.){3}\d{1,3}$/,
                    message: "IP inválido",
                  },
                })}
                placeholder="10.0.0.2"
              />
              {errors["remote-address"] && <p className="text-sm text-destructive">{errors["remote-address"].message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário</Label>
            <Textarea
              id="comment"
              {...register("comment")}
              placeholder="Descrição do usuário VPN"
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
