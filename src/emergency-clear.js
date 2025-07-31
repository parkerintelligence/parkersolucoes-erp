// EMERGENCY CACHE CLEAR - Modo de emergência para limpeza total do cache
console.log('🚨 EMERGENCY CACHE CLEAR - Sistema em modo de recuperação');
console.log('Cache bust timestamp:', Date.now());

// Força limpeza de cache extrema
try {
  // Limpar todos os storages
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpar cache do navegador se disponível
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) caches.delete(name);
    });
  }
  
  console.log('✅ Cache completamente limpo');
} catch (e) {
  console.log('❌ Erro na limpeza:', e);
}

// Interface temporal sem React
const root = document.getElementById('root');
if (root) {
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
      color: white;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <div style="max-width: 500px;">
        <div style="
          width: 80px;
          height: 80px;
          margin: 0 auto 2rem;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        ">🔧</div>
        
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700;">
          Sistema Parker
        </h1>
        
        <p style="font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem;">
          Limpeza de Cache em Progresso
        </p>
        
        <div style="
          background: rgba(255,255,255,0.1);
          padding: 2rem;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          margin-bottom: 2rem;
        ">
          <div style="margin-bottom: 1rem;">
            <div style="
              width: 100%;
              height: 8px;
              background: rgba(255,255,255,0.2);
              border-radius: 4px;
              overflow: hidden;
            ">
              <div id="progress" style="
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #10b981, #059669);
                border-radius: 4px;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
          
          <p style="color: #10b981; font-weight: 600; margin-bottom: 0.5rem;">
            🧹 Limpando Cache do Sistema
          </p>
          <p style="font-size: 0.9rem; opacity: 0.8;">
            Eliminando dependências em cache e forçando rebuild completo...
          </p>
        </div>
        
        <button onclick="window.location.reload()" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        ">
          🔄 Recarregar Sistema
        </button>
      </div>
    </div>
  `;
  
  // Animação de progresso
  let progress = 0;
  const progressBar = document.getElementById('progress');
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      // Auto-reload após 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
  }, 200);
  
  console.log('✅ Interface de emergência carregada');
}