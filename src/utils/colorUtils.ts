// Função para calcular a cor do texto baseada na luminosidade da cor de fundo
export const getContrastColor = (backgroundColor: string): string => {
  // Remove o # se presente
  const hex = backgroundColor.replace('#', '');
  
  // Converte para RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcula a luminosidade usando a fórmula padrão
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retorna branco para cores escuras e preto para cores claras
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Paleta de cores expandida para agendamentos
export const scheduleColorPalette = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f87171', // Rose
  '#a855f7', // Violet
  '#22d3ee', // Sky
  '#fbbf24', // Yellow
  '#fb7185', // Rose
  '#4ade80', // Green
  '#60a5fa', // Blue
  '#a78bfa', // Violet
  '#34d399', // Emerald
  '#fcd34d', // Amber
  '#f472b6', // Pink
  '#818cf8', // Indigo
  '#2dd4bf'  // Teal
];

// Função para obter uma cor aleatória da paleta
export const getRandomScheduleColor = (): string => {
  return scheduleColorPalette[Math.floor(Math.random() * scheduleColorPalette.length)];
};