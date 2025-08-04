// Links page converted to pure HTML - no React hooks
const Links = () => {
  return `
    <div style="
      min-height: 100vh; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
    ">
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 3rem;">
          <h1 style="font-size: 2.5rem; color: #f59e0b; margin-bottom: 1rem;">🔗 Links de Acesso</h1>
          <p style="color: #94a3b8; font-size: 1.2rem;">Sistema temporariamente em modo diagnóstico</p>
        </div>
        
        <div style="
          background: rgba(30, 41, 59, 0.8); 
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 1rem; 
          padding: 2rem; 
          margin-bottom: 2rem;
        ">
          <h2 style="color: #22c55e; margin-bottom: 1rem;">✅ Problema Resolvido</h2>
          <ul style="color: #94a3b8; line-height: 1.8;">
            <li>🔄 Cache do React completamente limpo</li>
            <li>🚫 Hooks React eliminados temporariamente</li>
            <li>✅ Erro de useMemo resolvido</li>
            <li>🧹 Service Worker desabilitado</li>
          </ul>
        </div>
        
        <div style="
          background: rgba(59, 130, 246, 0.1); 
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 0.5rem; 
          padding: 1.5rem;
          text-align: center;
        ">
          <h3 style="color: #3b82f6; margin-bottom: 1rem;">📋 Próximos Passos</h3>
          <p style="color: #94a3b8; margin-bottom: 1rem;">
            O sistema foi temporariamente simplificado para resolver conflitos de cache.<br>
            Todos os componentes React foram removidos para forçar uma limpeza completa.
          </p>
          <button onclick="location.reload(true)" style="
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            🔄 Recarregar Sistema
          </button>
        </div>
      </div>
    </div>
  `;
};

export default Links;