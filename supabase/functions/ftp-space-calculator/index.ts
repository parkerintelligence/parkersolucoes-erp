
import { corsHeaders } from '../_shared/cors.ts';

const FTP_TIMEOUT = 15000; // Reduzido para 15 segundos
const MAX_CONCURRENT_CONNECTIONS = 3; // Limite de conexões simultâneas

interface FtpSpaceResult {
  totalSize: number;
  totalFiles: number;
  totalDirectories: number;
  processedPaths: string[];
  errors: string[];
}

class FtpClient {
  private conn: Deno.TcpConn | null = null;
  private host: string;
  private port: number;
  private username: string;
  private password: string;

  constructor(host: string, port: number, username: string, password: string) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }

  async connect(): Promise<void> {
    console.log(`Connecting to ${this.host}:${this.port}`);
    
    const connectPromise = Deno.connect({ hostname: this.host, port: this.port });
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), FTP_TIMEOUT);
    });

    this.conn = await Promise.race([connectPromise, timeoutPromise]);
    
    // Read welcome message
    await this.readResponse();
    
    // Login
    await this.sendCommand(`USER ${this.username}`);
    await this.sendCommand(`PASS ${this.password}`);
  }

  async disconnect(): Promise<void> {
    if (this.conn) {
      try {
        await this.sendCommand('QUIT');
      } catch (error) {
        console.log('Error during disconnect:', error);
      }
      this.conn.close();
      this.conn = null;
    }
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    const encoder = new TextEncoder();
    await this.conn.write(encoder.encode(command + '\r\n'));
    return await this.readResponse();
  }

  private async readResponse(): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(4096);
    let response = '';
    
    const readPromise = this.conn.read(buffer);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('FTP response timeout')), FTP_TIMEOUT);
    });

    try {
      const bytesRead = await Promise.race([readPromise, timeoutPromise]);
      if (bytesRead) {
        response = decoder.decode(buffer.subarray(0, bytesRead));
      }
    } catch (error) {
      throw error;
    }

    console.log('FTP Response:', response.trim());
    return response;
  }

  async listDirectory(path: string): Promise<any[]> {
    try {
      // Enter passive mode
      const pasvResponse = await this.sendCommand('PASV');
      const pasvMatch = pasvResponse.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
      
      if (!pasvMatch) {
        throw new Error('Failed to parse PASV response: ' + pasvResponse);
      }

      const ip = `${pasvMatch[1]}.${pasvMatch[2]}.${pasvMatch[3]}.${pasvMatch[4]}`;
      const port = parseInt(pasvMatch[5]) * 256 + parseInt(pasvMatch[6]);

      console.log(`Data connection: ${ip}:${port}`);

      // Connect to data port with timeout
      const dataConnPromise = Deno.connect({ hostname: ip, port: port });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Data connection timeout')), FTP_TIMEOUT);
      });

      const dataConn = await Promise.race([dataConnPromise, timeoutPromise]);
      
      try {
        // Send LIST command
        const listResponse = await this.sendCommand(`LIST ${path}`);
        console.log('LIST Response:', listResponse);

        // Read directory listing with timeout
        const decoder = new TextDecoder();
        const buffer = new Uint8Array(65536);
        let listing = '';
        
        const readPromise = dataConn.read(buffer);
        const readTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Data read timeout')), FTP_TIMEOUT);
        });

        try {
          const bytesRead = await Promise.race([readPromise, readTimeoutPromise]);
          if (bytesRead) {
            listing = decoder.decode(buffer.subarray(0, bytesRead));
          }
        } catch (error) {
          console.error('Data read error:', error);
          throw error;
        }

        console.log('Raw FTP LIST data:', listing);

        // Parse listing
        const files = [];
        const lines = listing.trim().split('\n');
        
        for (const line of lines) {
          if (!line.trim() || line.startsWith('total')) continue;
          
          const parts = line.trim().split(/\s+/);
          if (parts.length < 9) continue;
          
          const permissions = parts[0];
          const isDirectory = permissions.startsWith('d');
          const size = parseInt(parts[4]) || 0;
          const name = parts.slice(8).join(' ');
          
          // Skip . and .. entries
          if (name === '.' || name === '..') continue;
          
          const filePath = path === '/' ? `/${name}` : `${path}/${name}`;
          
          files.push({
            name,
            size,
            isDirectory,
            path: filePath,
            permissions
          });
        }

        return files;
      } finally {
        dataConn.close();
      }
    } catch (error) {
      console.error(`Error listing directory ${path}:`, error);
      throw error;
    }
  }
}

async function calculateSpaceRecursively(
  ftpClient: FtpClient, 
  path: string, 
  result: FtpSpaceResult,
  maxDepth: number = 5, // Reduzido para evitar timeout
  currentDepth: number = 0
): Promise<void> {
  if (currentDepth >= maxDepth) {
    result.errors.push(`Max depth reached for path: ${path}`);
    return;
  }

  try {
    console.log(`Processing path: ${path} (depth: ${currentDepth})`);
    const files = await ftpClient.listDirectory(path);
    result.processedPaths.push(path);

    for (const file of files) {
      if (file.isDirectory) {
        result.totalDirectories++;
        // Recursively process subdirectory with error handling
        try {
          await calculateSpaceRecursively(ftpClient, file.path, result, maxDepth, currentDepth + 1);
        } catch (error) {
          const errorMsg = `Error processing subdirectory ${file.path}: ${error.message}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
          // Continue with other directories instead of failing completely
        }
      } else {
        result.totalFiles++;
        result.totalSize += file.size;
      }
    }
  } catch (error) {
    const errorMsg = `Error processing ${path}: ${error.message}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { host, port, username, password, path = '/' } = await req.json();

    console.log('=== FTP Space Calculator ===');
    console.log('Host:', host);
    console.log('Port:', port);
    console.log('User:', username);
    console.log('Path:', path);

    const ftpClient = new FtpClient(host, port, username, password);
    
    const result: FtpSpaceResult = {
      totalSize: 0,
      totalFiles: 0,
      totalDirectories: 0,
      processedPaths: [],
      errors: []
    };

    try {
      await ftpClient.connect();
      await calculateSpaceRecursively(ftpClient, path, result);
    } finally {
      await ftpClient.disconnect();
    }

    console.log('✅ Space calculation completed');
    console.log('Total Size:', result.totalSize);
    console.log('Total Files:', result.totalFiles);
    console.log('Total Directories:', result.totalDirectories);
    console.log('Processed Paths:', result.processedPaths.length);
    console.log('Errors:', result.errors.length);

    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ FTP space calculation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      totalSize: 0,
      totalFiles: 0,
      totalDirectories: 0,
      processedPaths: [],
      errors: [error.message]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
