// Main básico que funciona
import './index.css';

console.log('Sistema iniciando...');

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
        </div>
      </div>
    </div>
  `;
}

console.log('Interface carregada!');