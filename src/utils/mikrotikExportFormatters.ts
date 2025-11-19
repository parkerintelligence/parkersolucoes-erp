// Formatadores específicos para cada tipo de grid do Mikrotik

export const formatFirewallRule = (rule: any): string[] => [
  rule.chain || '-',
  rule.action || '-',
  rule.protocol || '-',
  rule['src-address'] || '-',
  rule['dst-address'] || '-',
  rule['dst-port'] || '-',
  rule.comment || '-',
  rule.disabled === 'true' ? '❌ Desabilitado' : '✅ Ativo'
];

export const formatNATRule = (rule: any): string[] => [
  rule.chain || '-',
  rule.action || '-',
  rule['src-address'] || '-',
  rule['dst-address'] || '-',
  rule['to-addresses'] || '-',
  rule['to-ports'] || '-',
  rule.comment || '-',
  rule.disabled === 'true' ? '❌ Desabilitado' : '✅ Ativo'
];

export const formatPPPSecret = (secret: any): string[] => [
  secret.name || '-',
  secret.service || '-',
  secret['caller-id'] || '-',
  secret['local-address'] || '-',
  secret['remote-address'] || '-',
  secret.profile || '-',
  secret.comment || '-',
  secret.disabled === 'true' ? '❌ Desabilitado' : '✅ Ativo'
];

export const formatIPAddress = (address: any): string[] => [
  address.address || '-',
  address.interface || '-',
  address.network || '-',
  address.comment || '-',
  address.disabled === 'true' ? '❌ Desabilitado' : (address.dynamic === 'true' ? '🔄 Dinâmico' : '✅ Estático')
];

export const formatDHCPLease = (lease: any): string[] => [
  lease['host-name'] || '-',
  lease.address || '-',
  lease['mac-address'] || '-',
  lease.server || '-',
  lease.status || '-',
  lease['expires-after'] || '-',
  lease.comment || '-'
];

export const formatInterface = (iface: any): string[] => [
  iface.name || '-',
  iface.type || '-',
  iface.running === 'true' ? '✅ Conectado' : '❌ Desconectado',
  formatBytes(parseInt(iface['rx-byte'] || '0')),
  formatBytes(parseInt(iface['tx-byte'] || '0')),
  iface.comment || '-',
  iface.disabled === 'true' ? '❌ Desabilitado' : '✅ Ativo'
];

export const formatLog = (log: any): string[] => [
  log.time || '-',
  log.topics || '-',
  log.message || '-'
];

// Helper function to format bytes
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Summary generators for WhatsApp messages
export const generateFirewallSummary = (rules: any[]): string => {
  const activeRules = rules.filter(r => r.disabled !== 'true').length;
  const disabledRules = rules.filter(r => r.disabled === 'true').length;
  
  const byChain = rules.reduce((acc: any, rule) => {
    const chain = rule.chain || 'unknown';
    acc[chain] = (acc[chain] || 0) + 1;
    return acc;
  }, {});

  let summary = `📊 *RESUMO*\n\n`;
  summary += `✅ Regras ativas: ${activeRules}\n`;
  summary += `❌ Regras desabilitadas: ${disabledRules}\n\n`;
  summary += `📍 *Por Chain:*\n`;
  Object.entries(byChain).forEach(([chain, count]) => {
    summary += `  • ${chain}: ${count}\n`;
  });

  return summary;
};

export const generateNATSummary = (rules: any[]): string => {
  const srcnat = rules.filter(r => r.chain === 'srcnat').length;
  const dstnat = rules.filter(r => r.chain === 'dstnat').length;
  const activeRules = rules.filter(r => r.disabled !== 'true').length;
  const masquerade = rules.filter(r => r.action === 'masquerade').length;

  let summary = `📊 *RESUMO*\n\n`;
  summary += `✅ Regras ativas: ${activeRules}\n`;
  summary += `📤 Srcnat: ${srcnat}\n`;
  summary += `📥 Dstnat: ${dstnat}\n`;
  summary += `🔀 Masquerade: ${masquerade}\n`;

  return summary;
};

export const generatePPPSummary = (secrets: any[]): string => {
  const activeUsers = secrets.filter(s => s.disabled !== 'true').length;
  const disabledUsers = secrets.filter(s => s.disabled === 'true').length;
  
  const byService = secrets.reduce((acc: any, secret) => {
    const service = secret.service || 'unknown';
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {});

  let summary = `📊 *RESUMO*\n\n`;
  summary += `✅ Usuários ativos: ${activeUsers}\n`;
  summary += `❌ Usuários desabilitados: ${disabledUsers}\n\n`;
  summary += `📍 *Por Serviço:*\n`;
  Object.entries(byService).forEach(([service, count]) => {
    summary += `  • ${service}: ${count}\n`;
  });

  return summary;
};

export const generateAddressesSummary = (addresses: any[]): string => {
  const staticIPs = addresses.filter(a => a.dynamic !== 'true').length;
  const dynamicIPs = addresses.filter(a => a.dynamic === 'true').length;
  
  const byInterface = addresses.reduce((acc: any, addr) => {
    const iface = addr.interface || 'unknown';
    acc[iface] = (acc[iface] || 0) + 1;
    return acc;
  }, {});

  let summary = `📊 *RESUMO*\n\n`;
  summary += `📌 IPs estáticos: ${staticIPs}\n`;
  summary += `🔄 IPs dinâmicos: ${dynamicIPs}\n\n`;
  summary += `📍 *Por Interface:*\n`;
  Object.entries(byInterface).forEach(([iface, count]) => {
    summary += `  • ${iface}: ${count}\n`;
  });

  return summary;
};

export const generateDHCPSummary = (leases: any[]): string => {
  const boundLeases = leases.filter(l => l.status === 'bound').length;
  const waitingLeases = leases.filter(l => l.status === 'waiting').length;
  const staticLeases = leases.filter(l => l.dynamic === 'false' || !l.dynamic).length;
  const dynamicLeases = leases.filter(l => l.dynamic === 'true').length;
  
  const byServer = leases.reduce((acc: any, lease) => {
    const server = lease.server || 'unknown';
    acc[server] = (acc[server] || 0) + 1;
    return acc;
  }, {});

  let summary = `📊 *RESUMO*\n\n`;
  summary += `✅ Dispositivos conectados: ${boundLeases}\n`;
  summary += `⏳ Aguardando: ${waitingLeases}\n`;
  summary += `🔒 IP Fixos: ${staticLeases}\n`;
  summary += `🔄 IP Dinâmicos: ${dynamicLeases}\n\n`;
  summary += `📍 *Por Servidor DHCP:*\n`;
  Object.entries(byServer).forEach(([server, count]) => {
    summary += `  • ${server}: ${count}\n`;
  });

  return summary;
};

export const generateInterfacesSummary = (interfaces: any[]): string => {
  const upInterfaces = interfaces.filter(i => i.running === 'true').length;
  const downInterfaces = interfaces.filter(i => i.running !== 'true').length;
  
  // Top 5 by traffic
  const topTraffic = interfaces
    .sort((a, b) => {
      const aTotal = (parseInt(a['rx-byte'] || '0') + parseInt(a['tx-byte'] || '0'));
      const bTotal = (parseInt(b['rx-byte'] || '0') + parseInt(b['tx-byte'] || '0'));
      return bTotal - aTotal;
    })
    .slice(0, 5);

  let summary = `📊 *RESUMO*\n\n`;
  summary += `✅ Interfaces ativas: ${upInterfaces}\n`;
  summary += `❌ Interfaces inativas: ${downInterfaces}\n\n`;
  summary += `📡 *Top 5 Tráfego:*\n`;
  topTraffic.forEach((iface, idx) => {
    const total = parseInt(iface['rx-byte'] || '0') + parseInt(iface['tx-byte'] || '0');
    summary += `  ${idx + 1}. ${iface.name}: ${formatBytes(total)}\n`;
  });

  return summary;
};

export const generateLogsSummary = (logs: any[]): string => {
  const byTopic = logs.reduce((acc: any, log) => {
    const topics = log.topics || 'unknown';
    acc[topics] = (acc[topics] || 0) + 1;
    return acc;
  }, {});

  // Get top 5 topics
  const topTopics = Object.entries(byTopic)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5);

  let summary = `📊 *RESUMO*\n\n`;
  summary += `📝 Total de logs: ${logs.length}\n\n`;
  summary += `📍 *Principais Tópicos:*\n`;
  topTopics.forEach(([topic, count]) => {
    summary += `  • ${topic}: ${count}\n`;
  });

  return summary;
};
