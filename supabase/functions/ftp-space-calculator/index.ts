
import { corsHeaders } from '../_shared/cors.ts';

const FTP_TIMEOUT = 30000; // 30 seconds timeout

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
    this.conn = await Deno.connect({ hostname: this.host, port: this.port });
    
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
    
    const timeoutId = setTimeout(() => {
      throw new Error('FTP response timeout');
    }, FTP_TIMEOUT);

    try {
      const bytesRead = await this.conn.read(buffer);
      if (bytesRead) {
        response = decoder.decode(buffer.subarray(0, bytesRead));
      }
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }

    console.log('FTP Response:', response.trim());
    return response;
  }

  async listDirectory(path: string): Promise<any[]> {
    // Enter passive mode
    const pasvResponse = await this.sendCommand('PASV');
    const pasvMatch = pasvResponse.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
    
    if (!pasvMatch) {
      throw new Error('Failed to parse PASV response');
    }

    const ip = `${pasvMatch[1]}.${pasvMatch[2]}.${pasvMatch[3]}.${pasvMatch[4]}`;
    const port = parseInt(pasvMatch[5]) * 256 + parseInt(pasvMatch[6]);

    console.log(`Data connection: ${ip} ${port}`);

    // Connect to data port
    const dataConn = await Deno.connect({ hostname: ip, port: port });
    
    // Send LIST command
    const listResponse = await this.sendCommand(`LIST ${path}`);
    console.log('LIST Response:', listResponse);

    // Read directory listing
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(65536);
    let listing = '';
    
    try {
      const bytesRead = await dataConn.read(buffer);
      if (bytesRead) {
        listing = decoder.decode(buffer.subarray(0, bytesRead));
      }
    } finally {
      dataConn.close();
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
  }
}

async function calculateSpaceRecursively(
  ftpClient: FtpClient, 
  path: string, 
  result: FtpSpaceResult,
  maxDepth: number = 10,
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
        // Recursively process subdirectory
        await calculateSpaceRecursively(ftpClient, file.path, result, maxDepth, currentDepth + 1);
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
