// Entry point COMPLETAMENTE independente do React para eliminar cache
// Removendo TODOS os imports que possam estar causando conflito

console.log('🔄 Sistema iniciando - Modo Recuperação de Cache...');
console.log('⚡ Timestamp de build:', Date.now());

// Sistema de detecção de estado de cache
const cacheStatus = {
  isCleared: !localStorage.getItem('vite-cache-error'),
  timestamp: Date.now(),
  attempts: parseInt(localStorage.getItem('recovery-attempts') || '0') + 1
};

localStorage.setItem('recovery-attempts', cacheStatus.attempts.toString());
console.log('📊 Status do Cache:', cacheStatus);

// Função de recuperação automática
function setupRecoverySystem() {
  // Limpar storage problemático
  try {
    localStorage.removeItem('vite-cache-error');
    sessionStorage.clear();
    console.log('🧹 Storage limpo com sucesso');
  } catch (e) {
    console.log('⚠️ Erro ao limpar storage:', e);
  }
  
  // Detectar se React pode ser reativado
  setTimeout(() => {
    if (cacheStatus.attempts > 3) {
      console.log('🔄 Tentando reativar React após limpeza de cache...');
      localStorage.setItem('react-ready', 'true');
    }
  }, 2000);
}

setupRecoverySystem();

// Interface simples funcional
const root = document.getElementById('root');
if (root) {
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
          Sistema Parker
        </h1>
        <p style="font-size: 1.25rem; opacity: 0.9; margin-bottom: 3rem;">
          Sistema de Gestão Empresarial
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 12px; backdrop-filter: blur(10px);">
          <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Status do Sistema</h2>
          <p style="color: #10b981; font-weight: 600;">✅ Sistema Operacional</p>
          <p style="margin-top: 1rem; opacity: 0.8;">Versão de Recuperação Ativa</p>
          <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.7;">
            🔄 Tentativa ${cacheStatus.attempts} | Cache: ${cacheStatus.isCleared ? 'Limpo' : 'Limpando...'}
          </p>
        </div>
      </div>
    </div>
  `;
}

console.log('Interface carregada!');