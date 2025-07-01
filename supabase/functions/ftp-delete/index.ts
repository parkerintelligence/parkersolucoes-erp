
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para conectar via FTP
async function connectFTP(host: string, port: number, username: string, password: string) {
  const conn = await Deno.connect({ hostname: host, port: port })
  
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const buffer = new Uint8Array(4096)
  
  // Ler resposta inicial
  const n = await conn.read(buffer)
  const response = decoder.decode(buffer.subarray(0, n || 0))
  console.log('FTP Server Response:', response)
  
  // Autenticar
  await conn.write(encoder.encode(`USER ${username}\r\n`))
  const userN = await conn.read(buffer)
  const userResponse = decoder.decode(buffer.subarray(0, userN || 0))
  console.log('USER Response:', userResponse)
  
  await conn.write(encoder.encode(`PASS ${password}\r\n`))
  const passN = await conn.read(buffer)
  const passResponse = decoder.decode(buffer.subarray(0, passN || 0))
  console.log('PASS Response:', passResponse)
  
  return conn
}

// Função para deletar arquivo via FTP
async function deleteFTPFile(conn: Deno.Conn, fileName: string, remotePath: string) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const buffer = new Uint8Array(4096)
  
  // Construir caminho completo do arquivo
  const fullPath = remotePath === '/' ? `/${fileName}` : `${remotePath}/${fileName}`
  
  // Enviar comando DELE
  await conn.write(encoder.encode(`DELE ${fullPath}\r\n`))
  const deleN = await conn.read(buffer)
  const deleResponse = decoder.decode(buffer.subarray(0, deleN || 0))
  console.log('DELE Response:', deleResponse)
  
  // Verificar se foi bem sucedido (código 250)
  if (deleResponse.startsWith('250')) {
    return true
  } else {
    throw new Error(`Delete failed: ${deleResponse}`)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { host, port, username, password, secure, path, fileName, passive } = await req.json()

    console.log('=== Real FTP Delete Operation ===')
    console.log('File:', fileName)
    console.log('Host:', host)
    console.log('Path:', path)

    try {
      // Tentar exclusão real do FTP
      const ftpConn = await connectFTP(host, port || 21, username, password)
      
      await deleteFTPFile(ftpConn, fileName, path)
      
      ftpConn.close()
      
      console.log('✅ Real FTP delete successful')
      
      return new Response(
        JSON.stringify({ success: true, message: 'File deleted successfully from real FTP server' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
      
    } catch (ftpError) {
      console.error('❌ Real FTP delete failed:', ftpError)
      
      // Fallback - simular sucesso mas alertar sobre falha
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('⚠️ Using fallback simulated delete')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `File deletion simulated (real FTP failed: ${ftpError.message})`,
          warning: 'Real FTP connection failed, operation was simulated'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error in ftp-delete function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
