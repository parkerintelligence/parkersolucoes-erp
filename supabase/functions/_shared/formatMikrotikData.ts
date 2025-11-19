// Helper functions for formatting Mikrotik dashboard data

export interface ClientDashboardData {
  clientName: string;
  clientId: string;
  identity?: any;
  resource?: any;
  routerboard?: any;
  interfaces?: any[];
  dhcpLeases?: any[];
  firewallRules?: any[];
  natRules?: any[];
  vpnSecrets?: any[];
  vpnActive?: any[];
  ipAddresses?: any[];
  error?: string;
}

export const detectIssues = (clientData: ClientDashboardData): string[] => {
  const issues: string[] = [];
  
  if (!clientData.resource) return issues;
  
  // Check CPU usage
  const cpuLoad = clientData.resource['cpu-load'];
  if (cpuLoad && cpuLoad > 80) {
    issues.push(`CPU alta: ${cpuLoad}%`);
  }
  
  // Check memory usage
  const freeMemory = clientData.resource['free-memory'];
  const totalMemory = clientData.resource['total-memory'];
  if (freeMemory && totalMemory) {
    const usedPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    if (usedPercent > 90) {
      issues.push(`Memória alta: ${usedPercent.toFixed(0)}%`);
    }
  }
  
  // Check interfaces
  const totalInterfaces = clientData.interfaces?.length || 0;
  const activeInterfaces = clientData.interfaces?.filter(i => {
    const isRunning = i.running === true || i.running === 'true';
    const isDisabled = i.disabled === true || i.disabled === 'true';
    return isRunning && !isDisabled;
  }).length || 0;
  if (totalInterfaces > 0 && activeInterfaces < totalInterfaces) {
    const downCount = totalInterfaces - activeInterfaces;
    issues.push(`${downCount} interface(s) inativa(s)`);
  }
  
  return issues;
};

export const generateClientSummary = (clientData: ClientDashboardData): string => {
  let summary = `📌 *${clientData.clientName.toUpperCase()}*\n`;
  
  // Error handling
  if (clientData.error) {
    summary += `❌ Erro: ${clientData.error}\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    return summary;
  }
  
  // System info
  if (clientData.identity) {
    summary += `🆔 ${clientData.identity.name || 'N/A'}\n`;
  }
  
  if (clientData.resource) {
    const version = clientData.resource.version || 'N/A';
    summary += `📦 RouterOS ${version}\n`;
    
    // Uptime
    const uptime = clientData.resource.uptime || '0s';
    summary += `⏱️ Uptime: ${formatUptime(uptime)}\n`;
    
    // CPU and Memory
    const cpuLoad = clientData.resource['cpu-load'] || 0;
    const freeMemory = clientData.resource['free-memory'] || 0;
    const totalMemory = clientData.resource['total-memory'] || 0;
    const memoryPercent = totalMemory > 0 ? ((totalMemory - freeMemory) / totalMemory * 100).toFixed(0) : '0';
    
    const cpuWarning = cpuLoad > 80 ? ' ⚠️' : '';
    const memWarning = parseInt(memoryPercent) > 90 ? ' ⚠️' : '';
    
    summary += `💻 CPU: ${cpuLoad}%${cpuWarning} | RAM: ${memoryPercent}%${memWarning}\n`;
  }
  
  // Interfaces
  const totalInterfaces = clientData.interfaces?.length || 0;
  const activeInterfaces = clientData.interfaces?.filter(i => {
    const isRunning = i.running === true || i.running === 'true';
    const isDisabled = i.disabled === true || i.disabled === 'true';
    return isRunning && !isDisabled;
  }).length || 0;
  summary += `🌐 Interfaces: ${activeInterfaces} ativas / ${totalInterfaces} total\n`;
  
  // Interface details - show status of each interface
  if (clientData.interfaces && clientData.interfaces.length > 0) {
    summary += `\n📡 *Status das Interfaces:*\n`;
    
    clientData.interfaces.forEach((iface: any) => {
      // Check if interface is disabled (can be boolean true or string 'true')
      const isDisabled = iface.disabled === true || iface.disabled === 'true';
      // Check if interface is running (can be boolean true or string 'true')
      const isRunning = iface.running === true || iface.running === 'true';
      
      // Interface is UP if it's running AND not disabled
      const isUp = isRunning && !isDisabled;
      const statusIcon = isUp ? '✅' : '❌';
      const ifaceName = iface.name || 'N/A';
      const ifaceType = iface.type || 'unknown';
      
      // Show interface name, type and status
      summary += `  ${statusIcon} ${ifaceName}`;
      
      // Add type in parentheses if available
      if (ifaceType && ifaceType !== 'unknown') {
        summary += ` (${ifaceType})`;
      }
      
      // Add disabled indicator if interface is administratively disabled
      if (isDisabled) {
        summary += ` - DESABILITADA`;
      } else if (!isRunning) {
        summary += ` - DOWN`;
      }
      
      summary += `\n`;
    });
    
    summary += `\n`;
  }
  
  // DHCP
  const dhcpTotal = clientData.dhcpLeases?.length || 0;
  const dhcpActive = clientData.dhcpLeases?.filter(l => l.status === 'bound').length || 0;
  summary += `👥 DHCP: ${dhcpActive} conectados / ${dhcpTotal} total\n`;
  
  // Firewall
  const firewallActive = clientData.firewallRules?.filter(r => !r.disabled).length || 0;
  summary += `🔒 Firewall: ${firewallActive} regras ativas\n`;
  
  // NAT
  const natActive = clientData.natRules?.filter(r => !r.disabled).length || 0;
  summary += `🔀 NAT: ${natActive} regras ativas\n`;
  
  // VPN
  const vpnTotal = clientData.vpnSecrets?.length || 0;
  const vpnConnected = clientData.vpnActive?.length || 0;
  summary += `🔐 VPN: ${vpnTotal} usuários / ${vpnConnected} conectados\n`;
  
  // Issues
  const issues = detectIssues(clientData);
  if (issues.length > 0) {
    summary += `⚠️ ALERTAS: ${issues.join(', ')}\n`;
  } else {
    summary += `✅ Status: Normal\n`;
  }
  
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  return summary;
};

export const formatMikrotikDashboardMessage = (clientsData: ClientDashboardData[]): string => {
  const now = new Date();
  const timestamp = now.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let message = `🔧 *RELATÓRIO MIKROTIK - DASHBOARD CONSOLIDADO*\n\n`;
  message += `📅 Data/Hora: ${timestamp}\n`;
  message += `📍 Total de Clientes: ${clientsData.length}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Add each client summary
  clientsData.forEach((clientData) => {
    message += generateClientSummary(clientData);
  });
  
  // Overall summary
  const successfulClients = clientsData.filter(c => !c.error);
  const totalDhcp = successfulClients.reduce((sum, c) => sum + (c.dhcpLeases?.filter(l => l.status === 'bound').length || 0), 0);
  const totalVpnActive = successfulClients.reduce((sum, c) => sum + (c.vpnActive?.length || 0), 0);
  const clientsWithIssues = successfulClients.filter(c => detectIssues(c).length > 0).length;
  
  // Calculate average uptime
  let avgUptime = 'N/A';
  const uptimes = successfulClients
    .filter(c => c.resource?.uptime)
    .map(c => parseUptimeToSeconds(c.resource.uptime));
  
  if (uptimes.length > 0) {
    const avgSeconds = uptimes.reduce((sum, u) => sum + u, 0) / uptimes.length;
    const days = Math.floor(avgSeconds / 86400);
    avgUptime = `${days} dias`;
  }
  
  message += `📈 *RESUMO GERAL*\n`;
  message += `• Total de dispositivos DHCP: ${totalDhcp}\n`;
  message += `• Total de VPNs ativas: ${totalVpnActive}\n`;
  message += `• Clientes com alertas: ${clientsWithIssues}\n`;
  message += `• Média de uptime: ${avgUptime}\n`;
  
  if (clientsData.length !== successfulClients.length) {
    const failedCount = clientsData.length - successfulClients.length;
    message += `• Clientes com erro: ${failedCount}\n`;
  }
  
  message += `\n---\n`;
  message += `Gerado automaticamente via Sistema Parker`;
  
  return message;
};

// Helper function to format uptime
const formatUptime = (uptime: string): string => {
  if (!uptime) return 'N/A';
  
  // Parse uptime format like "3w2d4h15m20s"
  const weeks = uptime.match(/(\d+)w/);
  const days = uptime.match(/(\d+)d/);
  const hours = uptime.match(/(\d+)h/);
  const minutes = uptime.match(/(\d+)m/);
  
  const parts = [];
  if (weeks) parts.push(`${weeks[1]}s`);
  if (days) parts.push(`${days[1]}d`);
  if (hours) parts.push(`${hours[1]}h`);
  if (minutes && parts.length < 2) parts.push(`${minutes[1]}m`);
  
  return parts.slice(0, 2).join(' ') || uptime;
};

// Helper function to parse uptime to seconds
const parseUptimeToSeconds = (uptime: string): number => {
  if (!uptime) return 0;
  
  let seconds = 0;
  
  const weeks = uptime.match(/(\d+)w/);
  const days = uptime.match(/(\d+)d/);
  const hours = uptime.match(/(\d+)h/);
  const minutes = uptime.match(/(\d+)m/);
  const secs = uptime.match(/(\d+)s/);
  
  if (weeks) seconds += parseInt(weeks[1]) * 604800;
  if (days) seconds += parseInt(days[1]) * 86400;
  if (hours) seconds += parseInt(hours[1]) * 3600;
  if (minutes) seconds += parseInt(minutes[1]) * 60;
  if (secs) seconds += parseInt(secs[1]);
  
  return seconds;
};
