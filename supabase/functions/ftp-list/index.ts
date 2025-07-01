
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { host, port, username, password, secure, path, passive } = await req.json()

    console.log('=== FTP List Operation ===')
    console.log('Host:', host)
    console.log('Port:', port)
    console.log('User:', username)
    console.log('Path:', path)

    // Simulação de conexão FTP real - aqui implementaríamos a biblioteca FTP
    // Por enquanto, retornamos dados simulados baseados na configuração real
    const mockFiles = [
      {
        name: 'backups',
        size: 0,
        lastModified: new Date().toISOString(),
        isDirectory: true,
        path: path === '/' ? '/backups' : `${path}/backups`,
        type: 'directory',
        permissions: 'drwxr-xr-x',
        owner: username
      },
      {
        name: 'databases',
        size: 0,
        lastModified: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
        isDirectory: true,
        path: path === '/' ? '/databases' : `${path}/databases`,
        type: 'directory',
        permissions: 'drwxr-xr-x',
        owner: username
      },
      {
        name: 'backup_2025-07-01.sql',
        size: 1048576, // 1MB
        lastModified: new Date().toISOString(),
        isDirectory: false,
        path: path,
        type: 'file',
        permissions: '-rw-r--r--',
        owner: username
      },
      {
        name: 'system_backup.tar.gz',
        size: 157286400, // 150MB
        lastModified: new Date().toISOString(),
        isDirectory: false,
        path: path,
        type: 'file',
        permissions: '-rw-r--r--',
        owner: username
      }
    ];

    console.log('Files retrieved:', mockFiles.length)

    return new Response(
      JSON.stringify({ files: mockFiles }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in ftp-list function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
