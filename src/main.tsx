import './index.css';

// Versão mais básica possível
const root = document.getElementById('root');
if (root) {
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 24px;
      font-family: Arial, sans-serif;
      text-align: center;
    ">
      <div>
        <h1>Sistema Parker</h1>
        <p>Resolvendo problema React...</p>
      </div>
    </div>
  `;
}