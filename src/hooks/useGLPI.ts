
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIntegrations } from './useIntegrations';
import { toast } from '@/hooks/use-toast';

export interface GLPITicket {
  id: number;
  name: string;
  content: string;
  status: number;
  priority: number;
  urgency: number;
  impact: number;
  users_id_requester: number;
  users_id_assign: number;
  entities_id: number;
  date: string;
  date_mod: string;
  solvedate?: string;
  closedate?: string;
  type: number;
  global_validation: number;
}

export interface GLPIComputer {
  id: number;
  name: string;
  serial: string;
  otherserial: string;
  contact: string;
  contact_num: string;
  users_id_tech: number;
  groups_id_tech: number;
  comment: string;
  date_mod: string;
  date_creation: string;
  autoupdatesystems_id: number;
  locations_id: number;
  networks_id: number;
  computermodels_id: number;
  computertypes_id: number;
  states_id: number;
  manufacturers_id: number;
  is_deleted: number;
  is_template: number;
  template_name: string;
  is_dynamic: number;
  entities_id: number;
}

export interface GLPIUser {
  id: number;
  name: string;
  realname: string;
  firstname: string;
  email: string;
  phone: string;
  mobile: string;
  entities_id: number;
  is_active: number;
  date_creation: string;
  date_mod: string;
}

const GLPI_STATUS_MAP: Record<number, string> = {
  1: 'Novo',
  2: 'Em Andamento (atribuído)',
  3: 'Em Andamento (planejado)',
  4: 'Pendente',
  5: 'Resolvido',
  6: 'Fechado'
};

const GLPI_PRIORITY_MAP: Record<number, string> = {
  1: 'Muito Baixa',
  2: 'Baixa',
  3: 'Média',
  4: 'Alta',
  5: 'Muito Alta',
  6: 'Crítica'
};

export const useGLPI = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();
  
  const glpiIntegration = integrations?.find(int => int.type === 'glpi');
  
  const makeGLPIRequest = async (endpoint: string, options: RequestInit = {}) => {
    if (!glpiIntegration) {
      throw new Error('GLPI não configurado');
    }

    const baseUrl = glpiIntegration.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/apirest.php/${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'App-Token': glpiIntegration.api_token || '',
        'Session-Token': glpiIntegration.webhook_url || '', // Using webhook_url to store session token
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GLPI API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  // Initialize GLPI session
  const initSession = useMutation({
    mutationFn: async () => {
      if (!glpiIntegration) {
        throw new Error('GLPI não configurado');
      }

      const baseUrl = glpiIntegration.base_url.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/apirest.php/initSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'App-Token': glpiIntegration.api_token || '',
          'Authorization': `Basic ${btoa(`${glpiIntegration.username}:${glpiIntegration.password}`)}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao inicializar sessão GLPI: ${response.status}`);
      }

      const data = await response.json();
      return data.session_token;
    },
    onSuccess: (sessionToken) => {
      console.log('Sessão GLPI inicializada:', sessionToken);
      toast({
        title: "Conectado ao GLPI",
        description: "Sessão inicializada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro ao inicializar sessão GLPI:', error);
      toast({
        title: "Erro de conexão",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Get tickets
  const tickets = useQuery({
    queryKey: ['glpi-tickets'],
    queryFn: () => makeGLPIRequest('Ticket?range=0-50'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get computers
  const computers = useQuery({
    queryKey: ['glpi-computers'],
    queryFn: () => makeGLPIRequest('Computer?range=0-50'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 60000, // Refresh every minute
  });

  // Get users
  const users = useQuery({
    queryKey: ['glpi-users'],
    queryFn: () => makeGLPIRequest('User?range=0-50'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
  });

  // Create ticket
  const createTicket = useMutation({
    mutationFn: async (ticketData: Partial<GLPITicket>) => {
      return makeGLPIRequest('Ticket', {
        method: 'POST',
        body: JSON.stringify({ input: ticketData }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glpi-tickets'] });
      toast({
        title: "Chamado criado",
        description: "Chamado criado com sucesso no GLPI!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar chamado",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Update ticket
  const updateTicket = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<GLPITicket> }) => {
      return makeGLPIRequest(`Ticket/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ input: updates }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glpi-tickets'] });
      toast({
        title: "Chamado atualizado",
        description: "Chamado atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar chamado",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const getStatusText = (status: number) => GLPI_STATUS_MAP[status] || `Status ${status}`;
  const getPriorityText = (priority: number) => GLPI_PRIORITY_MAP[priority] || `Prioridade ${priority}`;

  return {
    glpiIntegration,
    initSession,
    tickets: {
      ...tickets,
      data: tickets.data || [],
    },
    computers: {
      ...computers,
      data: computers.data || [],
    },
    users: {
      ...users,
      data: users.data || [],
    },
    createTicket,
    updateTicket,
    getStatusText,
    getPriorityText,
  };
};
