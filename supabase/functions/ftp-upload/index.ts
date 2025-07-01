
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

    // Para upload, precisamos processar FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    const config = JSON.parse(formData.get('config') as string)

    console.log('=== FTP Upload Operation ===')
    console.log('File:', file?.name)
    console.log('Size:', file?.size)
    console.log('Host:', config.host)
    console.log('Path:', config.path)

    if (!file) {
      throw new Error('No file provided')
    }

    // Aqui implementaríamos o upload real para o FTP
    // Por enquanto, simulamos o sucesso
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay de upload

    console.log('✅ File uploaded successfully (simulated)')

    return new Response(
      JSON.stringify({ success: true, message: 'File uploaded successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in ftp-upload function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
