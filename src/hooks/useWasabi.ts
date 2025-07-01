
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
  const wasabiIntegration = integrations?.find(int => int.type === 'wasabi' && int.is_active);

  console.log('Integração Wasabi ativa encontrada:', wasabiIntegration ? {
    id: wasabiIntegration.id,
    name: wasabiIntegration.name,
    base_url: wasabiIntegration.base_url,
    bucket_name: wasabiIntegration.bucket_name,
    username: wasabiIntegration.username ? '***' : 'não definido',
    region: wasabiIntegration.region
  } : 'Nenhuma');

  // Dados simulados para demonstração até implementar API real
  const mockFiles: WasabiFile[] = wasabiIntegration ? [
    { 
      id: '1', 
      name: 'backup-database-2024-01-15.tar.gz', 
      size: '2.1 GB', 
      lastModified: '2024-01-15 14:30', 
      type: 'backup',
      bucket: wasabiIntegration.bucket_name || 'bucket-configurado'
    },
    { 
      id: '2', 
      name: 'sistema-dump.sql', 
      size: '156 MB', 
      lastModified: '2024-01-14 09:15', 
      type: 'database',
      bucket: wasabiIntegration.bucket_name || 'bucket-configurado'
    },
    { 
      id: '3', 
      name: 'documentos-importantes.zip', 
      size: '45 MB', 
      lastModified: '2024-01-13 11:22', 
      type: 'document',
      bucket: wasabiIntegration.bucket_name || 'bucket-configurado'
    },
    { 
      id: '4', 
      name: 'fotos-projeto.zip', 
      size: '854 MB', 
      lastModified: '2024-01-12 16:45', 
      type: 'media',
      bucket: wasabiIntegration.bucket_name || 'bucket-configurado'
    },
  ] : [];

  // Buscar arquivos do bucket configurado
  const { data: files = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ['wasabi-files', wasabiIntegration?.id, wasabiIntegration?.bucket_name],
    queryFn: async (): Promise<WasabiFile[]> => {
      if (!wasabiIntegration) {
        console.log('Nenhuma integração Wasabi ativa encontrada');
        return [];
      }

      console.log('Buscando arquivos do Wasabi:', {
        bucket: wasabiIntegration.bucket_name,
        endpoint: wasabiIntegration.base_url,
        region: wasabiIntegration.region
      });

      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Retornando arquivos simulados:', mockFiles.length, 'arquivos');
      return mockFiles;
    },
    enabled: !!wasabiIntegration,
  });

  // Upload de arquivos
  const uploadFiles = useMutation({
    mutationFn: async ({ files }: { files: FileList }) => {
      if (!wasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      const bucketName = wasabiIntegration.bucket_name;
      if (!bucketName) {
        throw new Error('Nome do bucket não configurado');
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
        description: `${variables.files.length} arquivo(s) enviado(s) para o bucket ${wasabiIntegration?.bucket_name}.`,
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
      if (!wasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      console.log('Simulando download de:', fileName, 'do bucket:', wasabiIntegration.bucket_name);
      
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
      if (!wasabiIntegration) {
        throw new Error('Integração Wasabi não configurada');
      }

      console.log('Simulando remoção de:', fileName, 'do bucket:', wasabiIntegration.bucket_name);
      
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
    wasabiIntegration,
    uploadFiles,
    downloadFile,
    deleteFile,
    bucketName: wasabiIntegration?.bucket_name || 'Não configurado',
  };
};
