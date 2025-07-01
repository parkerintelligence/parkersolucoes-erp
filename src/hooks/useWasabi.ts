import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { WasabiService, WasabiFile, WasabiBucket } from '@/services/wasabiService';

export const useWasabi = () => {
  const queryClient = useQueryClient();
  const { data: integrations } = useIntegrations();
  const wasabiIntegrations = integrations?.filter(int => int.type === 'wasabi' && int.is_active) || [];
  const activeWasabiIntegration = wasabiIntegrations[0];

  console.log('Integrações Wasabi ativas encontradas:', wasabiIntegrations.length);

  // Buscar buckets disponíveis
  const { data: buckets = [], isLoading: isLoadingBuckets, error: bucketsError } = useQuery({
    queryKey: ['wasabi-buckets', activeWasabiIntegration?.id],
    queryFn: async (): Promise<WasabiBucket[]> => {
      if (!activeWasabiIntegration) {
        console.log('Nenhuma integração Wasabi ativa');
        return [];
      }

      console.log('Conectando ao Wasabi para listar buckets...');
      const wasabiService = new WasabiService(activeWasabiIntegration);
      return await wasabiService.listBuckets();
    },
    enabled: !!activeWasabiIntegration,
    retry: 2,
    retryDelay: 1000,
  });

  // Buscar arquivos de um bucket específico
  const getFilesQuery = (bucketName: string | null) => useQuery({
    queryKey: ['wasabi-files', activeWasabiIntegration?.id, bucketName],
    queryFn: async (): Promise<WasabiFile[]> => {
      if (!activeWasabiIntegration || !bucketName) {
        return [];
      }

      console.log('Listando arquivos do bucket:', bucketName);
      const wasabiService = new WasabiService(activeWasabiIntegration);
      return await wasabiService.listFiles(bucketName);
    },
    enabled: !!activeWasabiIntegration && !!bucketName,
    retry: 2,
    retryDelay: 1000,
  });

  // Criar novo bucket
  const createBucket = useMutation({
    mutationFn: async (bucketName: string) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const wasabiService = new WasabiService(activeWasabiIntegration);
      await wasabiService.createBucket(bucketName);
      
      return { success: true, bucketName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wasabi-buckets', activeWasabiIntegration?.id] });
      toast({
        title: "Bucket criado!",
        description: `Bucket "${data.bucketName}" foi criado com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao criar bucket:', error);
      toast({
        title: "Erro ao criar bucket",
        description: error.message || "Erro ao criar bucket no Wasabi.",
        variant: "destructive"
      });
    },
  });

  // Upload de arquivos
  const uploadFiles = useMutation({
    mutationFn: async ({ files, bucketName }: { files: FileList; bucketName: string }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const wasabiService = new WasabiService(activeWasabiIntegration);
      
      for (const file of Array.from(files)) {
        await wasabiService.uploadFile(file, bucketName);
      }

      return { 
        success: true, 
        files: Array.from(files).map(f => f.name),
        bucketName
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wasabi-files', activeWasabiIntegration?.id, variables.bucketName] });
      toast({
        title: "Upload concluído!",
        description: `${variables.files.length} arquivo(s) enviado(s) para o bucket ${variables.bucketName}.`,
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

  // Download de arquivo
  const downloadFile = useMutation({
    mutationFn: async ({ fileName, bucketName }: { fileName: string; bucketName: string }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const wasabiService = new WasabiService(activeWasabiIntegration);
      await wasabiService.downloadFile(fileName, bucketName);
      
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

  // Deletar arquivo
  const deleteFile = useMutation({
    mutationFn: async ({ fileName, bucketName }: { fileName: string; bucketName: string }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const wasabiService = new WasabiService(activeWasabiIntegration);
      await wasabiService.deleteFile(fileName, bucketName);
      
      return { success: true, fileName };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wasabi-files', activeWasabiIntegration?.id, variables.bucketName] });
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
    buckets,
    isLoadingBuckets,
    bucketsError,
    wasabiIntegration: activeWasabiIntegration,
    wasabiIntegrations,
    getFilesQuery,
    uploadFiles,
    downloadFile,
    deleteFile,
    createBucket,
  };
};
