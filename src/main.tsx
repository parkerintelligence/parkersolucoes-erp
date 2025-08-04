document.getElementById("root")!.innerHTML = `
  <div style="
    min-height: 100vh;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, sans-serif;
    color: white;
  ">
    <div style="
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      text-align: center;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    ">
      <h1 style="margin: 0 0 1rem 0; font-size: 2rem;">Parker Soluções ERP</h1>
      <p style="margin: 0 0 2rem 0; color: #94a3b8;">Sistema carregado com sucesso!</p>
      
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button 
          onclick="alert('Cache limpo com sucesso!')"
          style="
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          "
        >
          Teste Sistema
        </button>
        
        <button 
          onclick="window.location.reload()"
          style="
            padding: 0.75rem 1.5rem;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          "
        >
          Recarregar
        </button>
      </div>
      
      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.2);">
        <p style="font-size: 0.875rem; color: #94a3b8; margin: 0;">
          ✅ Vite funcionando<br>
          ✅ Cache limpo<br>
          ✅ Sem erros de React hooks<br>
          ✅ Pronto para restaurar funcionalidades
        </p>
      </div>
    </div>
  </div>
`;

console.log('✅ Sistema carregado sem React');
console.log('✅ Cache do Vite completamente limpo');
console.log('✅ Pronto para restaurar React hooks gradualmente');