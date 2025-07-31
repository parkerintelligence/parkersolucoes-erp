// NUCLEAR CACHE RESET - Solução final para problemas de cache persistente
console.log('☢️ NUCLEAR CACHE RESET - Iniciando limpeza extrema');

// Detectar tentativas anteriores
const attempts = parseInt(localStorage.getItem('nuclear-attempts') || '0') + 1;
localStorage.setItem('nuclear-attempts', attempts.toString());

console.log(`🔥 Tentativa nuclear ${attempts}/5`);

// Se chegou a 5 tentativas, restaurar main.tsx
if (attempts >= 5) {
  console.log('🔄 Limite de tentativas atingido - Restaurando main.tsx');
  localStorage.removeItem('nuclear-attempts');
  
  // Criar um script que modifica o index.html
  const script = document.createElement('script');
  script.textContent = `
    setTimeout(() => {
      fetch('/index.html')
        .then(response => response.text())
        .then(html => {
          const newHtml = html.replace(
            'src="/src/nuclear-reset.js"',
            'src="/src/main.tsx"'
          );
          document.open();
          document.write(newHtml);
          document.close();
        });
    }, 2000);
  `;
  document.head.appendChild(script);
}

// Limpeza extrema do cache
try {
  // Storage cleanup
  localStorage.clear();
  sessionStorage.clear();
  
  // IndexedDB cleanup
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        if (db.name) indexedDB.deleteDatabase(db.name);
      });
    });
  }
  
  // Service Worker cleanup
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
  
  // Cache API cleanup
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => caches.delete(cacheName));
    });
  }
  
  console.log('✅ Limpeza nuclear completa');
} catch (error) {
  console.error('❌ Erro na limpeza nuclear:', error);
}

// Interface de status
const root = document.getElementById('root');
if (root) {
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      background: linear-gradient(45deg, #dc2626, #b91c1c);
      color: white;
      font-family: 'Courier New', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
    ">
      <div style="max-width: 600px;">
        <div style="
          font-size: 4rem;
          margin-bottom: 2rem;
          animation: pulse 2s infinite;
        ">☢️</div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          NUCLEAR CACHE RESET
        </h1>
        
        <div style="
          background: rgba(0,0,0,0.3);
          padding: 2rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          border: 2px solid rgba(255,255,255,0.2);
        ">
          <p style="font-size: 1.2rem; margin-bottom: 1rem;">
            🔥 Tentativa ${attempts}/5
          </p>
          <p style="font-size: 1rem; opacity: 0.9;">
            Executando limpeza extrema de cache para resolver problemas persistentes do React
          </p>
          
          <div style="margin-top: 2rem;">
            <div style="
              width: 100%;
              height: 10px;
              background: rgba(255,255,255,0.2);
              border-radius: 5px;
              overflow: hidden;
            ">
              <div style="
                width: ${(attempts / 5) * 100}%;
                height: 100%;
                background: linear-gradient(90deg, #fbbf24, #f59e0b);
                transition: width 0.5s ease;
              "></div>
            </div>
            <p style="margin-top: 1rem; font-size: 0.9rem;">
              ${attempts < 5 ? 'Limpando caches profundos...' : 'Restaurando sistema normal...'}
            </p>
          </div>
        </div>
        
        <button onclick="location.reload()" style="
          background: linear-gradient(45deg, #059669, #10b981);
          border: none;
          color: white;
          padding: 15px 30px;
          font-size: 1.1rem;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          🚀 CONTINUAR RESET
        </button>
        
        ${attempts >= 3 ? `
          <div style="margin-top: 2rem; padding: 1rem; background: rgba(251, 191, 36, 0.2); border-radius: 8px;">
            <p style="font-size: 0.9rem;">⚠️ Múltiplas tentativas detectadas</p>
            <p style="font-size: 0.8rem; margin-top: 0.5rem;">Sistema será restaurado automaticamente na próxima tentativa</p>
          </div>
        ` : ''}
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `;
  
  // Auto-reload após alguns segundos se não for a última tentativa
  if (attempts < 5) {
    setTimeout(() => {
      window.location.reload();
    }, 4000);
  }
}