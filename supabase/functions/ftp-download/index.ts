
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

    const { host, port, username, password, secure, path, fileName, passive } = await req.json()

    console.log('=== FTP Download Operation ===')
    console.log('File:', fileName)
    console.log('Host:', host)
    console.log('Path:', path)

    // Aqui implementaríamos o download real do FTP
    // Por enquanto, simulamos um arquivo de exemplo
    const mockFileContent = `Mock content for ${fileName}\nDownloaded from FTP server: ${host}\nPath: ${path}\nTime: ${new Date().toISOString()}`
    
    console.log('✅ File downloaded successfully (simulated)')

    return new Response(
      mockFileContent,
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${fileName}"`
        },
      }
    )
  } catch (error) {
    console.error('Error in ftp-download function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
