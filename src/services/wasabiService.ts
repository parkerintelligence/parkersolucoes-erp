
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Integration } from '@/hooks/useIntegrations';

export interface WasabiFile {
  id: string;
  name: string;
  size: string;
  lastModified: string;
  type: string;
  bucket: string;
  sizeBytes: number;
}

export class WasabiService {
  private s3Client: S3Client | null = null;
  private integration: Integration | null = null;

  constructor(integration: Integration) {
    this.integration = integration;
    this.initializeClient();
  }

  private initializeClient() {
    if (!this.integration || !this.integration.username || !this.integration.password) {
      console.error('Credenciais do Wasabi não configuradas');
      return;
    }

    const endpoint = this.integration.base_url.startsWith('http') 
      ? this.integration.base_url 
      : `https://${this.integration.base_url}`;

    this.s3Client = new S3Client({
      endpoint,
      region: this.integration.region || 'us-east-1',
      credentials: {
        accessKeyId: this.integration.username,
        secretAccessKey: this.integration.password,
      },
      forcePathStyle: true, // Importante para Wasabi
    });

    console.log('Cliente Wasabi S3 inicializado:', {
      endpoint,
      region: this.integration.region || 'us-east-1',
      bucket: this.integration.bucket_name
    });
  }

  async listFiles(): Promise<WasabiFile[]> {
    if (!this.s3Client || !this.integration?.bucket_name) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Listando arquivos do bucket:', this.integration.bucket_name);
      
      const command = new ListObjectsV2Command({
        Bucket: this.integration.bucket_name,
        MaxKeys: 1000,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        console.log('Nenhum arquivo encontrado no bucket');
        return [];
      }

      const files: WasabiFile[] = response.Contents.map((object, index) => {
        const sizeBytes = object.Size || 0;
        const sizeFormatted = this.formatFileSize(sizeBytes);
        const lastModified = object.LastModified ? 
          object.LastModified.toLocaleString('pt-BR') : 
          'Data não disponível';

        return {
          id: `${object.Key}-${index}`,
          name: object.Key || 'Arquivo sem nome',
          size: sizeFormatted,
          lastModified,
          type: this.getFileType(object.Key || ''),
          bucket: this.integration!.bucket_name!,
          sizeBytes
        };
      });

      console.log(`${files.length} arquivos encontrados no bucket ${this.integration.bucket_name}`);
      return files;
    } catch (error) {
      console.error('Erro ao listar arquivos do Wasabi:', error);
      throw new Error(`Erro ao conectar com Wasabi: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async uploadFile(file: File): Promise<void> {
    if (!this.s3Client || !this.integration?.bucket_name) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Fazendo upload do arquivo:', file.name, 'para bucket:', this.integration.bucket_name);
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: this.integration.bucket_name,
        Key: file.name,
        Body: uint8Array,
        ContentType: file.type || 'application/octet-stream',
      });

      await this.s3Client.send(command);
      console.log('Upload concluído com sucesso:', file.name);
    } catch (error) {
      console.error('Erro no upload:', error);
      throw new Error(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    if (!this.s3Client || !this.integration?.bucket_name) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Deletando arquivo:', fileName, 'do bucket:', this.integration.bucket_name);
      
      const command = new DeleteObjectCommand({
        Bucket: this.integration.bucket_name,
        Key: fileName,
      });

      await this.s3Client.send(command);
      console.log('Arquivo deletado com sucesso:', fileName);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw new Error(`Erro ao deletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async downloadFile(fileName: string): Promise<void> {
    if (!this.s3Client || !this.integration?.bucket_name) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Baixando arquivo:', fileName, 'do bucket:', this.integration.bucket_name);
      
      const command = new GetObjectCommand({
        Bucket: this.integration.bucket_name,
        Key: fileName,
      });

      const response = await this.s3Client.send(command);
      
      if (response.Body) {
        const blob = await this.streamToBlob(response.Body as ReadableStream);
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Download iniciado para:', fileName);
      }
    } catch (error) {
      console.error('Erro no download:', error);
      throw new Error(`Erro no download: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async streamToBlob(stream: ReadableStream): Promise<Blob> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return new Blob(chunks);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (!extension) return 'file';
    
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
    const codeExts = ['js', 'ts', 'html', 'css', 'php', 'py', 'java'];
    
    if (imageExts.includes(extension)) return 'image';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    if (docExts.includes(extension)) return 'document';
    if (archiveExts.includes(extension)) return 'archive';
    if (codeExts.includes(extension)) return 'code';
    if (extension === 'sql') return 'database';
    
    return 'file';
  }
}
