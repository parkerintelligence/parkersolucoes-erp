
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getDaysFromLastModification = (lastModified: string | Date): number => {
  const lastModifiedDate = typeof lastModified === 'string' ? new Date(lastModified) : lastModified;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastModifiedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
