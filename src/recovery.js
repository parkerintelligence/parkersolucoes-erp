// RECOVERY MODE - Completamente isolado do React
console.log('🚨 MODO RECUPERAÇÃO - Entry Point Completamente Isolado');
console.log('⚡ Timestamp:', Date.now());

// Limpar todo cache e storage
try {
  localStorage.clear();
  sessionStorage.clear();
  console.log('🧹 Storage completamente limpo');
} catch (e) {
  console.log('⚠️ Erro ao limpar storage:', e);
}

// Interface funcional sem qualquer dependência React
const root = document.getElementById('root');
if (root) {
  const attempts = parseInt(localStorage.getItem('recovery-attempts') || '0') + 1;
  localStorage.setItem('recovery-attempts', attempts.toString());
  
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <div style="max-width: 600px;">
        <h1 style="font-size: 3.5rem; margin-bottom: 1rem; font-weight: 700;">
          🔧 Sistema Parker
        </h1>
        <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 3rem;">
          Modo de Recuperação Ativo
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 12px; backdrop-filter: blur(10px);">
          <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">🛠️ Diagnóstico do Sistema</h2>
          <p style="color: #10b981; font-weight: 600;">✅ Entry Point Isolado</p>
          <p style="margin-top: 0.5rem; opacity: 0.8;">🧹 Cache Limpo</p>
          <p style="margin-top: 0.5rem; opacity: 0.8;">🔄 Tentativa ${attempts}</p>
          <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.7;">
            Sistema executando em modo de recuperação total.<br>
            Nenhum código React sendo executado.
          </p>
          
          <div style="margin-top: 2rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
            <p style="color: #10b981; font-weight: 600; margin-bottom: 0.5rem;">🎯 Status de Recuperação</p>
            <p style="font-size: 0.9rem; opacity: 0.9;">
              Cache do Vite eliminado | React desabilitado | Entry point isolado
            </p>
          </div>
          
          <button 
            onclick="location.reload()" 
            style="
              margin-top: 2rem; 
              background: rgba(255,255,255,0.2); 
              border: 1px solid rgba(255,255,255,0.3); 
              color: white; 
              padding: 12px 24px; 
              border-radius: 8px; 
              cursor: pointer;
              font-size: 1rem;
              transition: all 0.3s ease;
            "
            onmouseover="this.style.background='rgba(255,255,255,0.3)'"
            onmouseout="this.style.background='rgba(255,255,255,0.2)'"
          >
            🔄 Recarregar Sistema
          </button>
        </div>
      </div>
    </div>
  `;
  
  console.log('✅ Interface de recuperação carregada com sucesso');
} else {
  console.error('❌ Elemento root não encontrado');
}

// Log detalhado para diagnóstico
console.log('📊 Diagnóstico completo:', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  attempts: localStorage.getItem('recovery-attempts'),
  url: window.location.href,
  storage: {
    localStorage: localStorage.length,
    sessionStorage: sessionStorage.length
  }
});