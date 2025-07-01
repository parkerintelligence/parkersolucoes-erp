
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
  itilcategories_id: number;
  locations_id: number;
  time_to_resolve?: string;
  internal_time_to_resolve?: string;
  slas_id_ttr: number;
  slas_id_tto: number;
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
  locations_id: number;
  networks_id: number;
  computermodels_id: number;
  computertypes_id: number;
  states_id: number;
  manufacturers_id: number;
  is_deleted: number;
  entities_id: number;
}

export interface GLPIProblem {
  id: number;
  name: string;
  content: string;
  status: number;
  priority: number;
  urgency: number;
  impact: number;
  date: string;
  date_mod: string;
  entities_id: number;
  users_id_recipient: number;
  impactcontent: string;
  symptomcontent: string;
  causecontent: string;
}

export interface GLPIChange {
  id: number;
  name: string;
  content: string;
  status: number;
  priority: number;
  urgency: number;
  impact: number;
  date: string;
  date_mod: string;
  entities_id: number;
  users_id_recipient: number;
  impactcontent: string;
  rolloutplancontent: string;
  backoutplancontent: string;
  checklistcontent: string;
}

export interface GLPISupplier {
  id: number;
  name: string;
  phonenumber: string;
  fax: string;
  website: string;
  email: string;
  address: string;
  postcode: string;
  town: string;
  state: string;
  country: string;
  comment: string;
  is_active: number;
}

export interface GLPIContract {
  id: number;
  name: string;
  num: string;
  cost: number;
  contracttypes_id: number;
  begin_date: string;
  duration: number;
  notice: number;
  periodicity: number;
  billing: number;
  renewal: number;
  max_links_allowed: number;
  alert: number;
  entities_id: number;
  is_deleted: number;
  comment: string;
}

export interface GLPISoftware {
  id: number;
  name: string;
  comment: string;
  locations_id: number;
  users_id_tech: number;
  groups_id_tech: number;
  is_update: number;
  softwares_id: number;
  manufacturers_id: number;
  entities_id: number;
  is_deleted: number;
  is_template: number;
  date_mod: string;
  date_creation: string;
}

export interface GLPIMonitor {
  id: number;
  name: string;
  serial: string;
  otherserial: string;
  size: number;
  have_micro: number;
  have_speaker: number;
  have_subd: number;
  have_bnc: number;
  have_dvi: number;
  have_pivot: number;
  have_hdmi: number;
  have_displayport: number;
  locations_id: number;
  users_id_tech: number;
  groups_id_tech: number;
  states_id: number;
  manufacturers_id: number;
  is_global: number;
  entities_id: number;
  is_deleted: number;
  date_mod: string;
  date_creation: string;
}

export interface GLPIPrinter {
  id: number;
  name: string;
  serial: string;
  otherserial: string;
  have_serial: number;
  have_parallel: number;
  have_usb: number;
  have_wifi: number;
  have_ethernet: number;
  locations_id: number;
  users_id_tech: number;
  groups_id_tech: number;
  states_id: number;
  manufacturers_id: number;
  is_global: number;
  entities_id: number;
  is_deleted: number;
  date_mod: string;
  date_creation: string;
}

export interface GLPINetworkEquipment {
  id: number;
  name: string;
  serial: string;
  otherserial: string;
  locations_id: number;
  users_id_tech: number;
  groups_id_tech: number;
  states_id: number;
  manufacturers_id: number;
  is_global: number;
  entities_id: number;
  is_deleted: number;
  ram: string;
  firmware: string;
  date_mod: string;
  date_creation: string;
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
  locations_id: number;
  usertitles_id: number;
  usercategories_id: number;
}

export interface GLPIEntity {
  id: number;
  name: string;
  comment: string;
  entities_id: number;
  completename: string;
  level: number;
  sons_cache: string;
  ancestors_cache: string;
}

export interface GLPILocation {
  id: number;
  name: string;
  comment: string;
  locations_id: number;
  completename: string;
  level: number;
  ancestors_cache: string;
  sons_cache: string;
  address: string;
  postcode: string;
  town: string;
  state: string;
  country: string;
  building: string;
  room: string;
  latitude: string;
  longitude: string;
}

export interface GLPIGroup {
  id: number;
  name: string;
  comment: string;
  entities_id: number;
  is_requester: number;
  is_watcher: number;
  is_assign: number;
  is_task: number;
  is_notify: number;
  is_itemgroup: number;
  is_usergroup: number;
  date_mod: string;
  date_creation: string;
}

const STATUS_MAP: Record<number, string> = {
  1: 'Novo',
  2: 'Em Andamento (atribuído)',
  3: 'Em Andamento (planejado)',
  4: 'Pendente',
  5: 'Resolvido',
  6: 'Fechado'
};

const PRIORITY_MAP: Record<number, string> = {
  1: 'Muito Baixa',
  2: 'Baixa',
  3: 'Média',
  4: 'Alta',
  5: 'Muito Alta',
  6: 'Crítica'
};

export const useGLPIExpanded = () => {
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
        'Session-Token': glpiIntegration.webhook_url || '',
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

  // Fetch all data types
  const tickets = useQuery({
    queryKey: ['glpi-tickets'],
    queryFn: () => makeGLPIRequest('Ticket?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 30000,
  });

  const problems = useQuery({
    queryKey: ['glpi-problems'],
    queryFn: () => makeGLPIRequest('Problem?range=0-50&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 60000,
  });

  const changes = useQuery({
    queryKey: ['glpi-changes'],
    queryFn: () => makeGLPIRequest('Change?range=0-50&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 60000,
  });

  const computers = useQuery({
    queryKey: ['glpi-computers'],
    queryFn: () => makeGLPIRequest('Computer?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000, // 5 minutes
  });

  const monitors = useQuery({
    queryKey: ['glpi-monitors'],
    queryFn: () => makeGLPIRequest('Monitor?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const printers = useQuery({
    queryKey: ['glpi-printers'],
    queryFn: () => makeGLPIRequest('Printer?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const networkEquipment = useQuery({
    queryKey: ['glpi-network-equipment'],
    queryFn: () => makeGLPIRequest('NetworkEquipment?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const software = useQuery({
    queryKey: ['glpi-software'],
    queryFn: () => makeGLPIRequest('Software?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const suppliers = useQuery({
    queryKey: ['glpi-suppliers'],
    queryFn: () => makeGLPIRequest('Supplier?range=0-50&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const contracts = useQuery({
    queryKey: ['glpi-contracts'],
    queryFn: () => makeGLPIRequest('Contract?range=0-50&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const users = useQuery({
    queryKey: ['glpi-users'],
    queryFn: () => makeGLPIRequest('User?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const entities = useQuery({
    queryKey: ['glpi-entities'],
    queryFn: () => makeGLPIRequest('Entity?range=0-50&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const locations = useQuery({
    queryKey: ['glpi-locations'],
    queryFn: () => makeGLPIRequest('Location?range=0-100&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
  });

  const groups = useQuery({
    queryKey: ['glpi-groups'],
    queryFn: () => makeGLPIRequest('Group?range=0-50&expand_dropdowns=true'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    refetchInterval: 300000,
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

  const getStatusText = (status: number) => STATUS_MAP[status] || `Status ${status}`;
  const getPriorityText = (priority: number) => PRIORITY_MAP[priority] || `Prioridade ${priority}`;

  return {
    glpiIntegration,
    initSession,
    tickets: {
      ...tickets,
      data: tickets.data || [],
    },
    problems: {
      ...problems,
      data: problems.data || [],
    },
    changes: {
      ...changes,
      data: changes.data || [],
    },
    computers: {
      ...computers,
      data: computers.data || [],
    },
    monitors: {
      ...monitors,
      data: monitors.data || [],
    },
    printers: {
      ...printers,
      data: printers.data || [],
    },
    networkEquipment: {
      ...networkEquipment,
      data: networkEquipment.data || [],
    },
    software: {
      ...software,
      data: software.data || [],
    },
    suppliers: {
      ...suppliers,
      data: suppliers.data || [],
    },
    contracts: {
      ...contracts,
      data: contracts.data || [],
    },
    users: {
      ...users,
      data: users.data || [],
    },
    entities: {
      ...entities,
      data: entities.data || [],
    },
    locations: {
      ...locations,
      data: locations.data || [],
    },
    groups: {
      ...groups,
      data: groups.data || [],
    },
    createTicket,
    updateTicket,
    getStatusText,
    getPriorityText,
  };
};
