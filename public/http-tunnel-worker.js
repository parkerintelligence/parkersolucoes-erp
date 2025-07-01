// HTTP Tunnel Service Worker
// Intercepta requests HTTP e aplica múltiplas estratégias de fallback

const CACHE_NAME = 'http-tunnel-cache-v1';
const TUNNEL_ENDPOINTS = new Set(['/mikrotik-api', '/zabbix-api']);

// Configuração do túnel
const TUNNEL_CONFIG = {
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 15000,
  fallbackStrategies: ['websocket', 'direct', 'proxy', 'edge-function']
};

self.addEventListener('install', (event) => {
  console.log('[HTTP Tunnel] Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[HTTP Tunnel] Service Worker ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Interceptar apenas requests para APIs específicas
  if (shouldInterceptRequest(url)) {
    event.respondWith(handleTunnelRequest(event.request));
  }
});

function shouldInterceptRequest(url) {
  return TUNNEL_ENDPOINTS.has(url.pathname) || 
         url.searchParams.has('tunnel') ||
         url.hostname.includes('mikrotik') ||
         url.hostname.includes('zabbix');
}

async function handleTunnelRequest(request) {
  console.log('[HTTP Tunnel] Interceptando request:', request.url);
  
  const strategies = TUNNEL_CONFIG.fallbackStrategies;
  let lastError = null;
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    console.log(`[HTTP Tunnel] Tentativa ${i + 1}: ${strategy}`);
    
    try {
      const response = await executeStrategy(strategy, request);
      if (response && response.ok) {
        console.log(`[HTTP Tunnel] Sucesso com ${strategy}`);
        return response;
      }
    } catch (error) {
      console.warn(`[HTTP Tunnel] Falha em ${strategy}:`, error);
      lastError = error;
      
      // Aguardar antes da próxima tentativa
      if (i < strategies.length - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, TUNNEL_CONFIG.retryDelay * (i + 1))
        );
      }
    }
  }
  
  // Se todas as estratégias falharam
  console.error('[HTTP Tunnel] Todas as estratégias falharam:', lastError);
  return new Response(JSON.stringify({
    error: 'HTTP Tunnel: Todas as estratégias de conexão falharam',
    details: lastError?.message,
    timestamp: new Date().toISOString()
  }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function executeStrategy(strategy, request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TUNNEL_CONFIG.timeout);
  
  try {
    let response;
    
    switch (strategy) {
      case 'websocket':
        response = await websocketTunnel(request, controller.signal);
        break;
      case 'direct':
        response = await directRequest(request, controller.signal);
        break;
      case 'proxy':
        response = await proxyRequest(request, controller.signal);
        break;
      case 'edge-function':
        response = await edgeFunctionRequest(request, controller.signal);
        break;
      default:
        throw new Error(`Estratégia desconhecida: ${strategy}`);
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function websocketTunnel(request, signal) {
  // Implementação WebSocket tunnel
  const tunnelData = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.text() : null
  };
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://tunnel-websocket-endpoint');
    
    const cleanup = () => {
      ws.close();
      signal.removeEventListener('abort', cleanup);
    };
    
    signal.addEventListener('abort', cleanup);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'http-request', data: tunnelData }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'http-response') {
          const response = new Response(data.body, {
            status: data.status,
            statusText: data.statusText,
            headers: data.headers
          });
          cleanup();
          resolve(response);
        }
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    
    ws.onerror = () => {
      cleanup();
      reject(new Error('WebSocket connection failed'));
    };
    
    setTimeout(() => {
      cleanup();
      reject(new Error('WebSocket timeout'));
    }, TUNNEL_CONFIG.timeout);
  });
}

async function directRequest(request, signal) {
  // Tentativa direta com headers CORS customizados
  const modifiedRequest = new Request(request.url, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: request.method !== 'GET' ? await request.clone().text() : null,
    signal
  });
  
  return fetch(modifiedRequest);
}

async function proxyRequest(request, signal) {
  // Usar serviço proxy público (cors-anywhere like)
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(request.url)}`;
  
  return fetch(proxyUrl, {
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== 'GET' ? await request.clone().text() : null,
    signal
  });
}

async function edgeFunctionRequest(request, signal) {
  // Fallback para edge function atual
  const url = new URL(request.url);
  let edgeEndpoint;
  
  if (url.hostname.includes('mikrotik') || url.pathname.includes('mikrotik')) {
    edgeEndpoint = '/functions/v1/mikrotik-proxy';
  } else if (url.hostname.includes('zabbix') || url.pathname.includes('zabbix')) {
    edgeEndpoint = '/functions/v1/zabbix-proxy';
  } else {
    throw new Error('Endpoint não identificado para edge function');
  }
  
  const body = await request.clone().json().catch(() => ({}));
  
  return fetch(edgeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': request.headers.get('Authorization') || ''
    },
    body: JSON.stringify(body),
    signal
  });
}

// Cache inteligente para responses bem-sucedidas
async function cacheResponse(request, response) {
  if (response.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

// Recuperar do cache em caso de falha total
async function getFallbackFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(request);
}