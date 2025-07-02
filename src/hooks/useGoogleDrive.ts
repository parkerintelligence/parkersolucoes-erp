import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIntegrations } from '@/hooks/useIntegrations';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime: string;
  webContentLink?: string;
  parents?: string[];
}

export interface FolderPath {
  id: string;
  name: string;
}

export const useGoogleDrive = () => {
  const queryClient = useQueryClient();
  const { data: integrations } = useIntegrations();
  const [currentPath, setCurrentPath] = useState<FolderPath[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState('root');

  const googleDriveIntegration = integrations?.find(
    (integration) => integration.type === 'google_drive' && integration.is_active
  );

  const isConnected = !!googleDriveIntegration;

  // Fetch files from current folder
  const { data: files, isLoading, refetch } = useQuery({
    queryKey: ['google-drive-files', currentFolderId],
    queryFn: async () => {
      if (!googleDriveIntegration) {
        throw new Error('Google Drive integration not configured');
      }

      console.log('Fetching files from folder:', currentFolderId);

      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: {
          action: 'list',
          folderId: currentFolderId,
          integrationId: googleDriveIntegration.id
        }
      });

      if (error) {
        console.error('Error fetching Google Drive files:', error);
        throw error;
      }

      console.log('Files fetched successfully:', data?.files?.length || 0);
      return data?.files || [];
    },
    enabled: isConnected,
  });

  const navigateToFolder = (folderId: string, folderName?: string) => {
    if (folderId === 'root') {
      setCurrentPath([]);
      setCurrentFolderId('root');
    } else {
      if (folderName) {
        setCurrentPath(prev => [...prev, { id: folderId, name: folderName }]);
      }
      setCurrentFolderId(folderId);
    }
  };

  const navigateBack = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1]?.id || 'root');
    }
  };

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, folderId }: { file: File; folderId: string }) => {
      if (!googleDriveIntegration) {
        throw new Error('Google Drive integration not configured');
      }

      console.log('Uploading file:', file.name, 'to folder:', folderId);

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:type/subtype;base64, prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: {
          action: 'upload',
          fileName: file.name,
          mimeType: file.type,
          fileData: base64,
          folderId,
          integrationId: googleDriveIntegration.id
        }
      });

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      toast({
        title: "Upload realizado!",
        description: "Arquivo enviado com sucesso para o Google Drive.",
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  // Download file mutation
  const downloadFileMutation = useMutation({
    mutationFn: async ({ fileId, fileName }: { fileId: string; fileName: string }) => {
      if (!googleDriveIntegration) {
        throw new Error('Google Drive integration not configured');
      }

      console.log('Downloading file:', fileName);

      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: {
          action: 'download',
          fileId,
          integrationId: googleDriveIntegration.id
        }
      });

      if (error) {
        console.error('Error downloading file:', error);
        throw error;
      }

      // Create blob and trigger download
      const blob = new Blob([Uint8Array.from(atob(data.fileData), c => c.charCodeAt(0))]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('File downloaded successfully:', fileName);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Download realizado!",
        description: "Arquivo baixado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Download error:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      if (!googleDriveIntegration) {
        throw new Error('Google Drive integration not configured');
      }

      console.log('Deleting file:', fileId);

      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: {
          action: 'delete',
          fileId,
          integrationId: googleDriveIntegration.id
        }
      });

      if (error) {
        console.error('Error deleting file:', error);
        throw error;
      }

      console.log('File deleted successfully:', fileId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      toast({
        title: "Arquivo excluído!",
        description: "Arquivo removido com sucesso do Google Drive.",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o arquivo. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId: string }) => {
      if (!googleDriveIntegration) {
        throw new Error('Google Drive integration not configured');
      }

      console.log('Creating folder:', name, 'in parent:', parentId);

      const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
        body: {
          action: 'createFolder',
          folderName: name,
          parentId,
          integrationId: googleDriveIntegration.id
        }
      });

      if (error) {
        console.error('Error creating folder:', error);
        throw error;
      }

      console.log('Folder created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-drive-files'] });
      toast({
        title: "Pasta criada!",
        description: "Nova pasta criada com sucesso no Google Drive.",
      });
    },
    onError: (error) => {
      console.error('Create folder error:', error);
      toast({
        title: "Erro ao criar pasta",
        description: "Não foi possível criar a pasta. Tente novamente.",
        variant: "destructive"
      });
    },
  });

  return {
    files,
    isLoading,
    isConnected,
    currentPath,
    currentFolderId,
    navigateToFolder,
    navigateBack,
    uploadFile: (file: File, folderId: string = currentFolderId) => 
      uploadFileMutation.mutateAsync({ file, folderId }),
    downloadFile: (fileId: string, fileName: string) => 
      downloadFileMutation.mutateAsync({ fileId, fileName }),
    deleteFile: (fileId: string) => deleteFileMutation.mutateAsync(fileId),
    createFolder: (name: string, parentId: string = currentFolderId) => 
      createFolderMutation.mutateAsync({ name, parentId }),
    searchFiles: (query: string) => {
      // TODO: Implementar busca via API
      console.log('Search files:', query);
    },
    refetch,
  };
};