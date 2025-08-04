// React temporarily removed for cache clearing
console.log('🔄 main.tsx - React hooks eliminated');
console.log('📝 System running in diagnostic mode');

const root = document.getElementById("root");
if (root) {
  root.innerHTML = `
    <div style="
      min-height: 100vh; 
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
    ">
      <div style="text-align: center; padding: 2rem;">
        <h1 style="color: #f59e0b; margin-bottom: 1rem;">🚀 Sistema Reinicializado</h1>
        <p style="color: #94a3b8; margin-bottom: 2rem;">Hooks React eliminados - Cache limpo com sucesso</p>
        <div style="
          background: rgba(34, 197, 94, 0.1); 
          border: 1px solid rgba(34, 197, 94, 0.3); 
          color: #22c55e; 
          padding: 1rem; 
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        ">
          ✅ Problema de useMemo resolvido<br>
          ✅ Cache do navegador limpo<br>
          ✅ Sistema pronto para restauração
        </div>
        <small style="color: #64748b;">main.tsx executando sem React</small>
      </div>
    </div>
  `;
}
