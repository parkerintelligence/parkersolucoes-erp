import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from './useIntegrations';
import { RealFtpService, RealFtpFile } from '@/services/realFtpService';
import React, { useState } from 'react';

export const useRealFtp = () => {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState('/');
  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const ftpIntegrations = integrations?.filter(int => int.type === 'ftp' && int.is_active) || [];
  const activeFtpIntegration = ftpIntegrations[0];

  console.log('=== Real FTP Hook Debug ===');
  console.log('Active FTP integration found:', !!activeFtpIntegration);
  console.log('Current path:', currentPath);
  
  if (activeFtpIntegration) {
    console.log('Integration details:', {
      id: activeFtpIntegration.id,
      name: activeFtpIntegration.name,
      host: activeFtpIntegration.base_url,
      username: activeFtpIntegration.username,
      port: activeFtpIntegration.port || 21
    });
  }

  // Fetch real FTP files
  const { data: files = [], isLoading: isLoadingFiles, error: filesError, refetch: refetchFiles } = useQuery({
    queryKey: ['real-ftp-files', activeFtpIntegration?.id, currentPath],
    queryFn: async (): Promise<RealFtpFile[]> => {
      if (!activeFtpIntegration) {
        console.log('No active FTP integration - returning empty array');
        return [];
      }

      console.log('=== Fetching Real FTP Files ===');
      console.log('Using integration:', activeFtpIntegration.name);
      console.log('Server URL:', activeFtpIntegration.base_url);
      console.log('Current path:', currentPath);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      const fileList = await realFtpService.listDirectory(currentPath);
      
      console.log('Real FTP files retrieved:', fileList.length);
      fileList.forEach((file, index) => {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          permissions: file.permissions,
          owner: file.owner
        });
      });
      
      return fileList;
    },
    enabled: !!activeFtpIntegration && !isLoadingIntegrations,
    retry: 2,
    retryDelay: 2000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Get available directories for navigation
  const directories = files.filter(file => file.isDirectory);

  // Navigate to directory
  const navigateToDirectory = (path: string) => {
    console.log('Navigating to directory:', path);
    setCurrentPath(path);
    queryClient.invalidateQueries({ queryKey: ['real-ftp-files'] });
  };

  // Go back to parent directory
  const goToParentDirectory = () => {
    if (currentPath === '/') return;
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';
    navigateToDirectory(parentPath);
  };

  // Download file from real FTP
  const downloadFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Downloading from Real FTP ===');
      console.log('File:', fileName);
      console.log('Path:', currentPath);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      await realFtpService.downloadFile(fileName, currentPath);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('Real FTP download successful:', data.fileName);
      toast({
        title: "📥 Download Concluído",
        description: `${data.fileName} foi baixado do servidor FTP.`,
      });
    },
    onError: (error: any) => {
      console.error('Real FTP download failed:', error);
      toast({
        title: "❌ Falha no Download",
        description: error.message || "Erro ao baixar arquivo do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Upload file to real FTP
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Uploading to Real FTP ===');
      console.log('File:', file.name);
      console.log('Path:', currentPath);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      await realFtpService.uploadFile(file, currentPath);
      
      return { success: true, fileName: file.name };
    },
    onSuccess: (data) => {
      console.log('Real FTP upload successful:', data.fileName);
      toast({
        title: "📤 Upload Concluído",
        description: `${data.fileName} foi enviado para o servidor FTP.`,
      });
      queryClient.invalidateQueries({ queryKey: ['real-ftp-files'] });
    },
    onError: (error: any) => {
      console.error('Real FTP upload failed:', error);
      toast({
        title: "❌ Falha no Upload",
        description: error.message || "Erro ao enviar arquivo para o servidor FTP.",
        variant: "destructive"
      });
    },
  });

  // Delete file from real FTP
  const deleteFile = useMutation({
    mutationFn: async (fileName: string) => {
      if (!activeFtpIntegration) {
        throw new Error('Nenhuma integração FTP configurada');
      }

      console.log('=== Deleting from Real FTP ===');
      console.log('File:', fileName);
      console.log('Path:', currentPath);
      
      const realFtpService = new RealFtpService(activeFtpIntegration);
      await realFtpService.deleteFile(fileName, currentPath);
      
      return { success: true, fileName };
    },
    onSuccess: (data) => {
      console.log('Real FTP deletion successful:', data.fileName);
      toast({
        title: "🗑️ Arquivo Excluído",
        description: `${data.fileName} foi removido do servidor FTP.`,
      });
      queryClient.invalidateQueries({ queryKey: ['real-ftp-files'] });
    },
    onError: (error: any) => {
      console.error('Real FTP deletion failed:', error);
      toast({
        title: "❌ Falha na Exclusão",
        description: error.message || "Erro ao excluir arquivo do servidor FTP.",
        variant: "destructive"
      });
    },
  });

  return {
    files,
    isLoadingFiles: isLoadingFiles || isLoadingIntegrations,
    filesError,
    ftpIntegration: activeFtpIntegration,
    ftpIntegrations,
    currentPath,
    directories,
    navigateToDirectory,
    goToParentDirectory,
    downloadFile,
    uploadFile,
    deleteFile,
    refetchFiles,
  };
};
