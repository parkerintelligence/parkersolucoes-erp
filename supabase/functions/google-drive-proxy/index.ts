import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Google Drive API endpoints
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_AUTH_BASE = 'https://oauth2.googleapis.com';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, integrationId, ...params } = await req.json();

    console.log('Google Drive Proxy - Action:', action, 'Integration ID:', integrationId);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('type', 'google_drive')
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      throw new Error('Google Drive integration not found or inactive');
    }

    const clientId = integration.api_token; // Client ID
    const clientSecret = integration.password; // Client Secret

    if (!clientId || !clientSecret) {
      throw new Error('Google Drive credentials not configured');
    }

    // Get access token from stored refresh token or initiate OAuth flow
    let accessToken = integration.webhook_url; // Temporarily storing access token here

    // If no access token, we need to implement OAuth flow
    if (!accessToken) {
      console.log('No access token found. OAuth flow needed.');
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      const redirectUri = `${origin}/admin`; // Específico para a página de admin
      return new Response(JSON.stringify({
        error: 'OAuth authorization required',
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive')}&` +
          `response_type=code&` +
          `access_type=offline&` +
          `prompt=consent&` +
          `state=${encodeURIComponent(integrationId)}`
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Helper function to refresh access token
    async function refreshAccessToken(refreshToken: string) {
      const response = await fetch(`${GOOGLE_AUTH_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }
      
      const data = await response.json();
      return data.access_token;
    }

    // Helper function to call Google Drive API
    async function callGoogleDriveAPI(endpoint: string, options: RequestInit = {}) {
      let currentAccessToken = accessToken;
      
      const makeRequest = async (token: string) => {
        return fetch(`${GOOGLE_DRIVE_API_BASE}${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      };

      let response = await makeRequest(currentAccessToken);
      
      // If token expired, try to refresh
      if (response.status === 401) {
        console.log('Access token expired, attempting refresh...');
        try {
          // Try to get refresh token from storage (you'd implement this)
          const refreshToken = integration.username; // Temporarily storing refresh token here
          if (refreshToken) {
            currentAccessToken = await refreshAccessToken(refreshToken);
            
            // Update stored access token
            await supabase
              .from('integrations')
              .update({ webhook_url: currentAccessToken })
              .eq('id', integrationId);
            
            response = await makeRequest(currentAccessToken);
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          throw new Error('Authentication failed. Please re-authorize.');
        }
      }
      
      if (!response.ok) {
        throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    }

    // Handle different actions
    switch (action) {
      case 'list':
        const folderId = params.folderId || 'root';
        console.log('Listing files in folder:', folderId);
        
        const listResponse = await callGoogleDriveAPI(
          `/files?q='${folderId}'+in+parents&pageSize=100&fields=files(id,name,mimeType,size,modifiedTime,parents,webContentLink)`
        );
        
        return new Response(JSON.stringify({
          files: listResponse.files || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'upload':
        console.log('Uploading file:', params.fileName);
        
        // Create file metadata
        const fileMetadata = {
          name: params.fileName,
          parents: params.folderId !== 'root' ? [params.folderId] : undefined
        };

        // First, create the file metadata
        const createResponse = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?uploadType=resumable`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fileMetadata)
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to initiate upload: ${createResponse.statusText}`);
        }

        const uploadUrl = createResponse.headers.get('Location');
        
        // Upload the file content
        const fileData = Uint8Array.from(atob(params.fileData), c => c.charCodeAt(0));
        const uploadResponse = await fetch(uploadUrl!, {
          method: 'PUT',
          headers: {
            'Content-Type': params.mimeType || 'application/octet-stream'
          },
          body: fileData
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
        }

        const uploadResult = await uploadResponse.json();
        
        return new Response(JSON.stringify({
          success: true,
          fileId: uploadResult.id,
          message: 'File uploaded successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'download':
        console.log('Downloading file:', params.fileId);
        
        const downloadResponse = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${params.fileId}?alt=media`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!downloadResponse.ok) {
          throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
        }

        const fileBuffer = await downloadResponse.arrayBuffer();
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
        
        return new Response(JSON.stringify({
          fileData: base64Data,
          mimeType: downloadResponse.headers.get('Content-Type') || 'application/octet-stream'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        console.log('Deleting file:', params.fileId);
        
        const deleteResponse = await callGoogleDriveAPI(`/files/${params.fileId}`, {
          method: 'DELETE'
        });
        
        return new Response(JSON.stringify({
          success: true,
          message: 'File deleted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'createFolder':
        console.log('Creating folder:', params.folderName);
        
        const folderMetadata = {
          name: params.folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: params.parentId !== 'root' ? [params.parentId] : undefined
        };

        const folderResponse = await callGoogleDriveAPI('/files', {
          method: 'POST',
          body: JSON.stringify(folderMetadata)
        });
        
        return new Response(JSON.stringify({
          success: true,
          folderId: folderResponse.id,
          message: 'Folder created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'authorize':
        // Handle OAuth callback
        const authCode = params.authCode;
        if (!authCode) {
          throw new Error('Authorization code is required');
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000';
        const redirectUri = `${origin}/admin`; // Específico para a página de admin
        
        const tokenResponse = await fetch(`${GOOGLE_AUTH_BASE}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: authCode,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          })
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange authorization code for tokens');
        }

        const tokens = await tokenResponse.json();
        
        // Store tokens in integration record
        await supabase
          .from('integrations')
          .update({
            webhook_url: tokens.access_token, // Access token
            username: tokens.refresh_token    // Refresh token
          })
          .eq('id', integrationId);

        return new Response(JSON.stringify({
          success: true,
          message: 'Authorization successful'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

  } catch (error) {
    console.error('Google Drive Proxy Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});