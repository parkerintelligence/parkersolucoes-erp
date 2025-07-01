
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';

interface WasabiFile {
  id: string;
  name: string;
  size: string;
  lastModified: string;
  type: string;
  bucket: string;
}

export const useWasabi = () => {
  const queryClient = useQueryClient();
  const { data: integrations } = useIntegrations();
  const wasabiIntegrations = integrations?.filter(int => int.type === 'wasabi' && int.is_active) || [];
  const activeWasabiIntegration = wasabiIntegrations[0]; // Usar a primeira integração ativa

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

  // Gerar dados simulados baseados nos buckets configurados
  const generateMockFiles = (bucketName: string): WasabiFile[] => {
    if (!bucketName) return [];
    
    return [
      { 
        id: '1', 
        name: `backup-database-${bucketName}-2024-01-15.tar.gz`, 
        size: '2.1 GB', 
        lastModified: '2024-01-15 14:30', 
        type: 'backup',
        bucket: bucketName
      },
      { 
        id: '2', 
        name: `sistema-dump-${bucketName}.sql`, 
        size: '156 MB', 
        lastModified: '2024-01-14 09:15', 
        type: 'database',
        bucket: bucketName
      },
      { 
        id: '3', 
        name: `documentos-importantes-${bucketName}.zip`, 
        size: '45 MB', 
        lastModified: '2024-01-13 11:22', 
        type: 'document',
        bucket: bucketName
      },
      { 
        id: '4', 
        name: `fotos-projeto-${bucketName}.zip`, 
        size: '854 MB', 
        lastModified: '2024-01-12 16:45', 
        type: 'media',
        bucket: bucketName
      },
    ];
  };

  // Buscar arquivos do bucket configurado
  const { data: files = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ['wasabi-files', activeWasabiIntegration?.id, activeWasabiIntegration?.bucket_name],
    queryFn: async (): Promise<WasabiFile[]> => {
      if (!activeWasabiIntegration || !activeWasabiIntegration.bucket_name) {
        console.log('Nenhuma integração Wasabi ativa com bucket configurado');
        return [];
      }

      console.log('Buscando arquivos do Wasabi:', {
        bucket: activeWasabiIntegration.bucket_name,
        endpoint: activeWasabiIntegration.base_url,
        region: activeWasabiIntegration.region
      });

      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockFiles = generateMockFiles(activeWasabiIntegration.bucket_name);
      console.log('Retornando arquivos simulados para bucket:', activeWasabiIntegration.bucket_name, '-', mockFiles.length, 'arquivos');
      return mockFiles;
    },
    enabled: !!activeWasabiIntegration && !!activeWasabiIntegration.bucket_name,
  });

  // Upload de arquivos
  const uploadFiles = useMutation({
    mutationFn: async ({ files }: { files: FileList }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const bucketName = activeWasabiIntegration.bucket_name;
      if (!bucketName) {
        throw new Error('Nome do bucket não configurado na integração');
      }

      console.log('Simulando upload de arquivos:', {
        bucket: bucketName,
        files: Array.from(files).map(f => ({ name: f.name, size: f.size }))
      });

      // Simular processo de upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      return { 
        success: true, 
        files: Array.from(files).map(f => f.name),
        bucket: bucketName
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wasabi-files'] });
      toast({
        title: "Upload simulado concluído!",
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

  // Download de arquivo
  const downloadFile = useMutation({
    mutationFn: async ({ fileName }: { fileName: string }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      console.log('Simulando download de:', fileName, 'do bucket:', activeWasabiIntegration.bucket_name);
      
      // Simular processo de download
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, fileName };
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Download simulado",
        description: `Download simulado de ${variables.fileName} (funcionalidade em desenvolvimento)`,
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
    mutationFn: async ({ fileName }: { fileName: string }) => {
      if (!activeWasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      console.log('Simulando remoção de:', fileName, 'do bucket:', activeWasabiIntegration.bucket_name);
      
      // Simular processo de exclusão
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, fileName };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['wasabi-files'] });
      toast({
        title: "Arquivo removido (simulado)",
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
    wasabiIntegration: activeWasabiIntegration,
    wasabiIntegrations,
    uploadFiles,
    downloadFile,
    deleteFile,
    bucketName: activeWasabiIntegration?.bucket_name || 'Não configurado',
  };
};
