
import { useState, useEffect, ChangeEvent } from 'react';
import { useRealFtp } from '@/hooks/useRealFtp';
import { toast } from '@/hooks/use-toast';
import BackupsEmptyState from '@/components/BackupsEmptyState';
import BackupsHeader from '@/components/BackupsHeader';
import BackupsNavigation from '@/components/BackupsNavigation';
import BackupsStatistics from '@/components/BackupsStatistics';
import BackupsFileTable from '@/components/BackupsFileTable';

const Backups = () => {
  const {
    files: ftpFiles = [],
    isLoadingFiles,
    ftpIntegration,
    downloadFile,
    uploadFile,
    deleteFile,
    refetchFiles,
    currentPath,
    navigateToDirectory,
    goToParentDirectory,
    directories
  } = useRealFtp();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [hostAvailability, setHostAvailability] = useState<'checking' | 'available' | 'unavailable'>('checking');

  const backupFilesAndFolders = ftpFiles;
  const backupFiles = ftpFiles.filter(file => !file.isDirectory && (file.name.includes('backup') || file.name.includes('.sql') || file.name.includes('.tar') || file.name.includes('.zip') || file.name.includes('.gz')));

  useEffect(() => {
    const checkHostAvailability = async () => {
      if (!ftpIntegration) return;
      setHostAvailability('checking');
      try {
        await fetch(`https://${ftpIntegration.base_url}`, { method: 'HEAD', mode: 'no-cors' });
        setHostAvailability('available');
      } catch (error) {
        console.log('Host check failed, but this is expected for FTP servers');
        setHostAvailability(ftpFiles.length > 0 ? 'available' : 'unavailable');
      }
    };
    if (ftpIntegration) checkHostAvailability();
  }, [ftpIntegration, ftpFiles.length]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingFile(file);
    try {
      await uploadFile.mutateAsync(file);
      toast({ title: "✅ Upload Concluído", description: `${file.name} foi enviado para o servidor FTP.` });
    } catch (error) {
      toast({ title: "❌ Falha no Upload", description: "Erro ao enviar arquivo para o servidor FTP.", variant: "destructive" });
    } finally {
      setUploadingFile(null);
      setIsDialogOpen(false);
    }
  };

  const handleDownload = async (fileName: string) => {
    try { await downloadFile.mutateAsync(fileName); } catch (error) {
      toast({ title: "❌ Falha no Download", description: "Erro ao baixar arquivo do servidor FTP.", variant: "destructive" });
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${fileName}?`)) return;
    try { await deleteFile.mutateAsync(fileName); } catch (error) {
      toast({ title: "❌ Falha na Exclusão", description: "Erro ao excluir arquivo do servidor FTP.", variant: "destructive" });
    }
  };

  const handleFolderClick = (folder: any) => {
    if (folder.isDirectory) navigateToDirectory(folder.path);
  };

  const totalBackups = backupFiles.length;
  const recentBackups = backupFiles.filter(file => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(file.lastModified) > weekAgo;
  }).length;

  if (!ftpIntegration) return <BackupsEmptyState />;

  return (
    <div className="space-y-4">
      <BackupsHeader
        integrationName={ftpIntegration.name}
        baseUrl={ftpIntegration.base_url}
        currentPath={currentPath}
        availability={hostAvailability}
        files={ftpFiles}
        uploadingFile={uploadingFile}
        uploadFile={uploadFile}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        goToParentDirectory={goToParentDirectory}
        onFileUpload={handleFileUpload}
      />

      <BackupsNavigation
        directories={directories}
        currentPath={currentPath}
        navigateToDirectory={navigateToDirectory}
      />

      <BackupsStatistics
        totalBackups={totalBackups}
        recentBackups={recentBackups}
        totalSize={backupFiles.reduce((total, file) => total + file.size, 0)}
        totalFiles={ftpFiles.length}
      />

      <BackupsFileTable
        files={backupFilesAndFolders}
        isLoadingFiles={isLoadingFiles}
        currentPath={currentPath}
        onFolderClick={handleFolderClick}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onRefresh={refetchFiles}
        downloadFile={downloadFile}
        deleteFile={deleteFile}
      />
    </div>
  );
};

export default Backups;
