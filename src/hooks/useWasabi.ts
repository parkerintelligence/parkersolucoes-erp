
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { WasabiService, WasabiFile } from '@/services/wasabiService';

export const useWasabi = () => {
  const queryClient = useQueryClient();
  const { data: integrations } = useIntegrations();
  const wasabiIntegrations = integrations?.filter(int => int.type === 'wasabi' && int.is_active) || [];
  const activeWasabiIntegration = wasabiIntegrations[0];

  console.log('Integrações Wasabi ativas encontradas:', wasabiIntegrations.length);
  if (activeWasabiIntegration) {
    console.log('Integração Wasabi ativa:', {
      id: activeWasabiIntegration.id,
      name: activeWasabiIntegration.name,
      base_url: activeWasabiIntegration.base_url,
      bucket_name: activeWasabiIntegration.bucket_name,
      username: activeWasabiIntegration.username ? '***' : 'não definido',
      region: activeWasabiIntegration.region
    });
  }

  // Buscar arquivos do bucket usando a API real do Wasabi
  const { data: files = [], isLoading: isLoadingFiles, error } = useQuery({
    queryKey: ['wasabi-files', activeWasabiIntegration?.id, activeWasabiIntegration?.bucket_name],
    queryFn: async (): Promise<WasabiFile[]> => {
      if (!activeWasabiIntegration || !activeWasabiIntegration.bucket_name) {
        console.log('Nenhuma integração Wasabi ativa com bucket configurado');
        return [];
      }

      console.log('Conectando ao Wasabi com configurações reais...');
      const wasabiService = new WasabiService(activeWasabiIntegration);
      return await wasabiService.listFiles();
    },
    enabled: !!activeWasabiIntegration && !!activeWasabiIntegration.bucket_name,
    retry: 2,
    retryDelay: 1000,
  });

  // Upload de arquivos usando API real
  const uploadFiles = useMutation({
    mutationFn: async ({ files }: { files: FileList }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const wasabiService = new WasabiService(activeWasabiIntegration);
      
      // Upload de cada arquivo
      for (const file of Array.from(files)) {
        await wasabiService.uploadFile(file);
      }

      return { 
        success: true, 
        files: Array.from(files).map(f => f.name),
        bucket: activeWasabiIntegration.bucket_name
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wasabi-files'] });
      toast({
        title: "Upload concluído!",
        description: `${variables.files.length} arquivo(s) enviado(s) para o bucket ${activeWasabiIntegration?.bucket_name}.`,
      });
    },
    onError: (error) => {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao enviar arquivos para o Wasabi.",
        variant: "destructive"
      });
    },
  });

  // Download de arquivo usando API real
  const downloadFile = useMutation({
    mutationFn: async ({ fileName }: { fileName: string }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const wasabiService = new WasabiService(activeWasabiIntegration);
      await wasabiService.downloadFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Download iniciado",
        description: `Download de ${variables.fileName} foi iniciado.`,
      });
    },
    onError: (error) => {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: error.message || "Erro ao baixar arquivo do Wasabi.",
        variant: "destructive"
      });
    },
  });

  // Deletar arquivo usando API real
  const deleteFile = useMutation({
    mutationFn: async ({ fileName }: { fileName: string }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const wasabiService = new WasabiService(activeWasabiIntegration);
      await wasabiService.deleteFile(fileName);
      
      return { success: true, fileName };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wasabi-files'] });
      toast({
        title: "Arquivo removido",
        description: `${variables.fileName} foi removido com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao remover arquivo:', error);
      toast({
        title: "Erro ao remover arquivo",
        description: error.message || "Erro ao remover arquivo do Wasabi.",
        variant: "destructive"
      });
    },
  });

  return {
    files,
    isLoadingFiles,
    error,
    wasabiIntegration: activeWasabiIntegration,
    wasabiIntegrations,
    uploadFiles,
    downloadFile,
    deleteFile,
    bucketName: activeWasabiIntegration?.bucket_name || 'Não configurado',
  };
};
