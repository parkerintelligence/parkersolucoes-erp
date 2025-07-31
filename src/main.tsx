// Main entry - versão básica sem React por enquanto
console.log('Main.tsx carregando...');

const root = document.getElementById('root');
if (root) {
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      font-size: 24px;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">Sistema Parker</h1>
        <p style="font-size: 1.5rem; opacity: 0.9;">Sistema inicializado com sucesso!</p>
        <p style="font-size: 1rem; opacity: 0.7; margin-top: 2rem;">Versão de recuperação ativa</p>
      </div>
    </div>
  `;
  console.log('Interface carregada com sucesso!');
}