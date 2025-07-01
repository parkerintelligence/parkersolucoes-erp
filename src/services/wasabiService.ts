
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
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

export interface WasabiBucket {
  name: string;
  creationDate: string;
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
      region: this.integration.region || 'us-east-1'
    });
  }

  async listBuckets(): Promise<WasabiBucket[]> {
    if (!this.s3Client) {
      throw new Error('Cliente S3 não configurado');
    }

    try {
      console.log('Listando buckets do Wasabi...');
      
      const command = new ListBucketsCommand({});
      const response = await this.s3Client.send(command);
      
      if (!response.Buckets) {
        console.log('Nenhum bucket encontrado');
        return [];
      }

      const buckets: WasabiBucket[] = response.Buckets.map((bucket) => ({
        name: bucket.Name || 'Bucket sem nome',
        creationDate: bucket.CreationDate ? 
          bucket.CreationDate.toLocaleString('pt-BR') : 
          'Data não disponível'
      }));

      console.log(`${buckets.length} buckets encontrados`);
      return buckets;
    } catch (error) {
      console.error('Erro ao listar buckets do Wasabi:', error);
      throw new Error(`Erro ao conectar com Wasabi: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async listFiles(bucketName: string): Promise<WasabiFile[]> {
    if (!this.s3Client || !bucketName) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Listando arquivos do bucket:', bucketName);
      
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
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
          bucket: bucketName,
          sizeBytes
        };
      });

      console.log(`${files.length} arquivos encontrados no bucket ${bucketName}`);
      return files;
    } catch (error) {
      console.error('Erro ao listar arquivos do Wasabi:', error);
      throw new Error(`Erro ao conectar com Wasabi: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async uploadFile(file: File, bucketName: string): Promise<void> {
    if (!this.s3Client || !bucketName) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Fazendo upload do arquivo:', file.name, 'para bucket:', bucketName);
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const command = new PutObjectCommand({
        Bucket: bucketName,
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

  async deleteFile(fileName: string, bucketName: string): Promise<void> {
    if (!this.s3Client || !bucketName) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Deletando arquivo:', fileName, 'do bucket:', bucketName);
      
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });

      await this.s3Client.send(command);
      console.log('Arquivo deletado com sucesso:', fileName);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      throw new Error(`Erro ao deletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async downloadFile(fileName: string, bucketName: string): Promise<void> {
    if (!this.s3Client || !bucketName) {
      throw new Error('Cliente S3 ou bucket não configurado');
    }

    try {
      console.log('Baixando arquivo:', fileName, 'do bucket:', bucketName);
      
      const command = new GetObjectCommand({
        Bucket: bucketName,
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
