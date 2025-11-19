import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIntegrations } from '@/hooks/useIntegrations';
import { toast } from '@/hooks/use-toast';

// Interfaces para as entidades do GLPI
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
  groups_id_assign: number;
  entities_id: number;
  date_creation: string;
  date_mod: string;
  date: string;
  solvedate?: string;
  closedate?: string;
  time_to_resolve?: string;
  type: number;
  global_validation: number;
  slas_id_ttr: number;
  slas_id_tto: number;
  slas_ttr: any;
  slas_tto: any;
  requesters: any[];
  observers: any[];
  assigns: any[];
  suppliers: any[];
  categories_id: number;
  itilcategories_id?: number;
  requesttypes_id?: number;
  locations_id: number;
  validation?: any;
  satisfaction?: any;
  followup?: any[];
  task?: any[];
  document?: any[];
  links?: any[];
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
  operatingsystems_id: number;
  operatingsystemversions_id: number;
  operatingsystemservicepacks_id: number;
  operatingsystemarchitectures_id: number;
  operatingsystemkernelversions_id: number;
  license_id: number;
  license_number: string;
  autoupdatesystems_id: number;
  locations_id: number;
  domains_id: number;
  networks_id: number;
  computermodels_id: number;
  computertypes_id: number;
  is_template: number;
  template_name: string;
  manufacturers_id: number;
  is_deleted: number;
  is_dynamic: number;
  users_id: number;
  groups_id: number;
  states_id: number;
  ticket_tco: number;
  uuid: string;
  date_creation: string;
  is_recursive: number;
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
  users_id_requester: number;
  users_id_assign: number;
  groups_id_assign: number;
  entities_id: number;
  date_creation: string;
  date_mod: string;
  date: string;
  solvedate?: string;
  closedate?: string;
  time_to_resolve?: string;
  type: number;
  global_validation: number;
  slas_id_ttr: number;
  slas_id_tto: number;
}

export interface GLPIChange {
  id: number;
  name: string;
  content: string;
  status: number;
  priority: number;
  urgency: number;
  impact: number;
  users_id_requester: number;
  users_id_assign: number;
  groups_id_assign: number;
  entities_id: number;
  date_creation: string;
  date_mod: string;
  date: string;
  solvedate?: string;
  closedate?: string;
  time_to_resolve?: string;
  type: number;
  global_validation: number;
  slas_id_ttr: number;
  slas_id_tto: number;
}

export interface GLPISupplier {
  id: number;
  name: string;
  suppliertypes_id: number;
  address: string;
  postcode: string;
  town: string;
  state: string;
  country: string;
  website: string;
  phonenumber: string;
  comment: string;
  email: string;
  fax: string;
  is_active: number;
  date_mod: string;
  entities_id: number;
  is_recursive: number;
  date_creation: string;
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
  is_recursive: number;
  suppliers_id: number;
  states_id: number;
  comment: string;
  date_mod: string;
  date_creation: string;
}

export interface GLPISoftware {
  id: number;
  name: string;
  comment: string;
  entities_id: number;
  is_recursive: number;
  manufacturers_id: number;
  is_update: number;
  softwares_id: number;
  is_template: number;
  template_name: string;
  date_mod: string;
  users_id_tech: number;
  groups_id_tech: number;
  is_deleted: number;
  is_helpdesk_visible: number;
  date_creation: string;
  pictures: any[];
}

export interface GLPIMonitor {
  id: number;
  name: string;
  comment: string;
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
  monitortypes_id: number;
  monitormodels_id: number;
  manufacturers_id: number;
  is_global: number;
  is_deleted: number;
  is_template: number;
  template_name: string;
  users_id_tech: number;
  groups_id_tech: number;
  states_id: number;
  contact: string;
  contact_num: string;
  users_id: number;
  groups_id: number;
  date_mod: string;
  date_creation: string;
  entities_id: number;
  is_recursive: number;
  is_dynamic: number;
}

export interface GLPIPrinter {
  id: number;
  name: string;
  comment: string;
  serial: string;
  otherserial: string;
  contact: string;
  contact_num: string;
  users_id_tech: number;
  groups_id_tech: number;
  have_serial: number;
  have_parallel: number;
  have_usb: number;
  have_wifi: number;
  have_ethernet: number;
  locations_id: number;
  printertypes_id: number;
  printermodels_id: number;
  manufacturers_id: number;
  is_global: number;
  is_deleted: number;
  is_template: number;
  template_name: string;
  init_pages_counter: number;
  last_pages_counter: number;
  users_id: number;
  groups_id: number;
  states_id: number;
  ticket_tco: number;
  is_dynamic: number;
  date_mod: string;
  date_creation: string;
  entities_id: number;
  is_recursive: number;
}

export interface GLPINetworkEquipment {
  id: number;
  name: string;
  comment: string;
  serial: string;
  otherserial: string;
  contact: string;
  contact_num: string;
  users_id_tech: number;
  groups_id_tech: number;
  locations_id: number;
  networkequipmenttypes_id: number;
  networkequipmentmodels_id: number;
  manufacturers_id: number;
  is_deleted: number;
  is_template: number;
  template_name: string;
  users_id: number;
  groups_id: number;
  states_id: number;
  ticket_tco: number;
  is_dynamic: number;
  uuid: string;
  date_mod: string;
  date_creation: string;
  entities_id: number;
  is_recursive: number;
  ram: string;
  uptime: string;
  cpu: number;
  memory: number;
}

export interface GLPIUser {
  id: number;
  name: string;
  password: string;
  password2: string;
  email: string;
  firstname: string;
  realname: string;
  nickname: string;
  registration_number: string;
  phone: string;
  phone2: string;
  mobile: string;
  fax: string;
  website: string;
  icq: string;
  skype: string;
  jabber: string;
  yahoo: string;
  msn: string;
  aim: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  youtube: string;
  instagram: string;
  picture: string;
  comment: string;
  language: string;
  usertitles_id: number;
  usercategories_id: number;
  date_format: number;
  number_format: number;
  names_format: number;
  csv_delimiter: string;
  is_active: number;
  is_deleted: number;
  entities_id: number;
  is_recursive: number;
  last_login: string;
  date_mod: string;
  date_creation: string;
  profiles_id: number;
}

export interface GLPIEntity {
  id: number;
  name: string;
  entities_id: number;
  completename: string;
  comment: string;
  level: number;
  sons_cache: string;
  ancestors_cache: string;
  address: string;
  postcode: string;
  town: string;
  state: string;
  country: string;
  website: string;
  phonenumber: string;
  fax: string;
  email: string;
  admin_email: string;
  admin_email_name: string;
  admin_reply: string;
  admin_reply_name: string;
  notification_subject_tag: string;
  ldap_dn: string;
  tag: string;
  authldaps_id: number;
  mail_domain: string;
  entity_ldapfilter: string;
  mailing_signature: string;
  cartridges_alert_repeat: number;
  consumables_alert_repeat: number;
  use_licenses_alert: number;
  send_licenses_alert_before_delay: number;
  use_certificates_alert: number;
  send_certificates_alert_before_delay: number;
  use_contracts_alert: number;
  send_contracts_alert_before_delay: number;
  use_infocoms_alert: number;
  send_infocoms_alert_before_delay: number;
  use_reservations_alert: number;
  autoclose_delay: number;
  notclosed_delay: number;
  calendars_id: number;
  auto_assign_mode: number;
  tickettype: number;
  max_closedate: string;
  inquest_config: number;
  inquest_rate: number;
  inquest_delay: number;
  inquest_URL: string;
  autofill_mark: string;
  autofill_order: string;
  autofill_buy_date: string;
  autofill_delivery_date: string;
  autofill_use_date: string;
  autofill_warranty_date: string;
  inquest_duration: number;
  date_mod: string;
  date_creation: string;
  autofill_decommission_date: string;
  suppliers_id_software: number;
  display_users_initials: number;
  contract_alerts: string;
  cartridge_alerts: string;
  consumable_alerts: string;
  use_domains_alert: number;
  send_domains_alert_close_expiries_delay: number;
  send_domains_alert_expired_delay: number;
  transfers_id: number;
}

export interface GLPILocation {
  id: number;
  name: string;
  locations_id: number;
  completename: string;
  comment: string;
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
  altitude: string;
  date_mod: string;
  date_creation: string;
  entities_id: number;
  is_recursive: number;
}

export interface GLPIGroup {
  id: number;
  name: string;
  comment: string;
  ldap_field: string;
  ldap_value: string;
  ldap_group_dn: string;
  date_mod: string;
  users_id: number;
  groups_id: number;
  completename: string;
  level: number;
  ancestors_cache: string;
  sons_cache: string;
  is_requester: number;
  is_watcher: number;
  is_assign: number;
  is_task: number;
  is_notify: number;
  is_itemgroup: number;
  is_usergroup: number;
  ticket_create: number;
  ticket_steal: number;
  id_supervisor: number;
  date_creation: string;
  entities_id: number;
  is_recursive: number;
}

// Mapeamentos de status e prioridade
export const STATUS_MAP: Record<number, string> = {
  1: 'Novo',
  2: 'Em Andamento (Atribuído)',
  3: 'Em Andamento (Planejado)',
  4: 'Pendente',
  5: 'Solucionado',
  6: 'Fechado'
};

export const PRIORITY_MAP: Record<number, string> = {
  1: 'Muito baixa',
  2: 'Baixa',
  3: 'Média',
  4: 'Alta',
  5: 'Muito alta',
  6: 'Urgente'
};

export const useGLPIExpanded = () => {
  const { data: integrations } = useIntegrations();
  const queryClient = useQueryClient();

  // Obter a integração do GLPI
  const glpiIntegration = integrations?.find(integration => 
    integration.type === 'glpi' && integration.is_active
  );

  console.log('📊 GLPI Integration status:', {
    hasIntegration: !!glpiIntegration,
    hasAppToken: !!glpiIntegration?.api_token,
    hasSessionToken: !!glpiIntegration?.webhook_url,
    isEnabled: !!glpiIntegration?.is_active,
    baseUrl: glpiIntegration?.base_url || 'não configurado',
    sessionToken: glpiIntegration?.webhook_url ? 'presente' : 'ausente'
  });

  // Função para fazer requisições através do proxy
  const makeGLPIRequest = async (endpoint: string, options?: RequestInit) => {
    if (!glpiIntegration) {
      throw new Error('GLPI não configurado');
    }

    console.log('📡 Fazendo requisição GLPI via proxy:', {
      endpoint,
      integrationId: glpiIntegration.id,
      method: options?.method || 'GET'
    });

    try {
      const { data, error } = await supabase.functions.invoke('glpi-proxy', {
        body: {
          integrationId: glpiIntegration.id,
          endpoint,
          method: options?.method || 'GET',
          data: options?.body ? JSON.parse(options.body as string) : undefined
        }
      });

      console.log('📨 Resposta do proxy GLPI:', {
        hasData: !!data,
        hasError: !!error,
        endpoint
      });

      if (error) {
        console.error('❌ Erro na função Edge:', error);
        throw new Error(`Erro na comunicação: ${error.message || 'Erro desconhecido'}`);
      }

      if (data?.error) {
        console.error('❌ Erro da API GLPI:', data.error);
        throw new Error(data.error);
      }

      return data?.result || data;
    } catch (error) {
      console.error('❌ Erro geral na chamada GLPI:', error);
      throw error;
    }
  };

  // Função para inicializar sessão via proxy
  const initializeSession = async (): Promise<string | null> => {
    if (!glpiIntegration) {
      throw new Error('GLPI não configurado');
    }

    console.log('🚀 Inicializando sessão GLPI via proxy:', {
      integrationId: glpiIntegration.id,
      hasAppToken: !!glpiIntegration.api_token,
      hasCredentials: !!(glpiIntegration.username || glpiIntegration.password)
    });

    try {
      const { data, error } = await supabase.functions.invoke('glpi-proxy', {
        body: {
          integrationId: glpiIntegration.id,
          endpoint: 'initSession',
          method: 'POST'
        }
      });

      if (error) {
        console.error('❌ Erro na função Edge:', error);
        throw new Error(`Erro na comunicação: ${error.message || 'Erro desconhecido'}`);
      }

      if (data?.error) {
        console.error('❌ Erro da API GLPI:', data.error);
        throw new Error(data.error);
      }

      const sessionToken = data?.session_token || data?.result?.session_token;

      if (!sessionToken) {
        throw new Error('Session token não retornado pelo servidor');
      }

      console.log('✅ Session token obtido com sucesso');

      // Salvar o session token na integração
      const { error: updateError } = await supabase
        .from('integrations')
        .update({ 
          webhook_url: sessionToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', glpiIntegration.id);

      if (updateError) {
        console.error('❌ Erro ao salvar session token:', updateError);
        throw new Error('Erro ao salvar session token');
      }

      console.log('✅ Session token salvo na integração');
      
      // Invalidar queries para forçar re-fetch com nova sessão
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      queryClient.invalidateQueries({ queryKey: ['glpi'] });

      return sessionToken;
    } catch (error) {
      console.error('❌ Erro ao inicializar sessão GLPI:', error);
      throw error;
    }
  };

  // Mutation para inicialização de sessão
  const initSession = useMutation({
    mutationFn: initializeSession,
    onSuccess: (sessionToken) => {
      if (sessionToken) {
        toast({
          title: "Sessão GLPI iniciada!",
          description: "Conectado com sucesso ao GLPI.",
        });
      }
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao inicializar sessão GLPI:', error);
      toast({
        title: "Erro ao conectar com GLPI",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Auto-inicializar sessão se não houver token
  React.useEffect(() => {
    if (glpiIntegration && glpiIntegration.api_token && !glpiIntegration.webhook_url && !initSession.isPending) {
      console.log('🔄 Auto-inicializando sessão GLPI...');
      initSession.mutate();
    }
  }, [glpiIntegration, initSession]);

  // Queries para buscar dados
  const tickets = useQuery({
    queryKey: ['glpi', 'tickets', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('tickets?expand_dropdowns=false&with_devices=false&with_infocoms=false&with_contracts=false&with_documents=false&with_tickets=false&with_problems=false&with_changes=false&with_notes=false&with_logs=false'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 30000,
    retry: (failureCount, error) => {
      // Não tentar novamente em caso de erros de configuração
      if (error.message.includes('não configurado') || 
          error.message.includes('Credenciais inválidas') ||
          error.message.includes('App Token')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const problems = useQuery({
    queryKey: ['glpi', 'problems', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('problems'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 30000,
  });

  const changes = useQuery({
    queryKey: ['glpi', 'changes', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('changes'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 30000,
  });

  const computers = useQuery({
    queryKey: ['glpi', 'computers', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('computers'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const monitors = useQuery({
    queryKey: ['glpi', 'monitors', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('Monitor'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const printers = useQuery({
    queryKey: ['glpi', 'printers', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('Printer'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const networkequipments = useQuery({
    queryKey: ['glpi', 'networkequipments', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('NetworkEquipment'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const software = useQuery({
    queryKey: ['glpi', 'software', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('Software'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const suppliers = useQuery({
    queryKey: ['glpi', 'suppliers', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('Supplier'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const contracts = useQuery({
    queryKey: ['glpi', 'contracts', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('Contract'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const users = useQuery({
    queryKey: ['glpi', 'users', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('users'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const entities = useQuery({
    queryKey: ['glpi', 'entities', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('entities'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const locations = useQuery({
    queryKey: ['glpi', 'locations', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('locations'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  const groups = useQuery({
    queryKey: ['glpi', 'groups', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('groups'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  // Nova query para categorias de tickets
  const itilCategories = useQuery({
    queryKey: ['glpi', 'itilcategories', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('ITILCategory'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  // Nova query para tipos de solicitação
  const requestTypes = useQuery({
    queryKey: ['glpi', 'requesttypes', glpiIntegration?.id],
    queryFn: () => makeGLPIRequest('RequestType'),
    enabled: !!glpiIntegration && !!glpiIntegration.webhook_url,
    staleTime: 60000,
  });

  // Função para obter valores válidos com fallbacks
  const getValidValues = () => {
    // Buscar primeira entidade válida
    const validEntity = entities.data?.find((entity: any) => entity?.id) || { id: 0 };
    
    // Buscar primeiro usuário válido
    const validUser = users.data?.find((user: any) => user?.id) || { id: 2 };
    
    // Buscar primeira categoria válida
    const validCategory = itilCategories.data?.find((cat: any) => cat?.id) || { id: 1 };
    
    // Buscar primeiro tipo de solicitação válido
    const validRequestType = requestTypes.data?.find((type: any) => type?.id) || { id: 1 };
    
    console.log('🔍 Valores válidos encontrados:', {
      entity: validEntity,
      user: validUser,
      category: validCategory,
      requestType: validRequestType
    });
    
    return {
      entities_id: validEntity.id,
      users_id_requester: validUser.id,
      itilcategories_id: validCategory.id,
      requesttypes_id: validRequestType.id
    };
  };

  // Mutations para criar, atualizar e deletar tickets
  const createTicket = useMutation({
    mutationFn: async (ticketData: Partial<GLPITicket>) => {
      console.log('🎫 [useGLPIExpanded] Iniciando criação de ticket:', ticketData);
      
      // Validar dados obrigatórios
      if (!ticketData.name?.trim()) {
        throw new Error('O título do ticket é obrigatório');
      }
      
      // Obter valores válidos dinamicamente
      const validValues = getValidValues();
      console.log('🎫 [useGLPIExpanded] Valores válidos obtidos:', validValues);
      
      // Mesclar dados do ticket com valores válidos
      const enhancedTicketData = {
        name: ticketData.name,
        content: ticketData.content || '',
        priority: ticketData.priority || 3,
        urgency: ticketData.urgency || 3,
        impact: ticketData.impact || 3,
        type: ticketData.type || 1,
        status: 1, // Status: Novo
        entities_id: ticketData.entities_id || validValues.entities_id,
        users_id_requester: validValues.users_id_requester,
        users_id_assign: ticketData.users_id_assign,
        itilcategories_id: ticketData.itilcategories_id || validValues.itilcategories_id,
        requesttypes_id: validValues.requesttypes_id
      };
      
      console.log('🎫 [useGLPIExpanded] Dados finais do ticket:', {
        name: enhancedTicketData.name,
        'name.length': enhancedTicketData.name?.length || 0,
        content: enhancedTicketData.content,
        'content.length': enhancedTicketData.content?.length || 0,
        entities_id: enhancedTicketData.entities_id,
        users_id_assign: enhancedTicketData.users_id_assign,
        users_id_requester: enhancedTicketData.users_id_requester,
        priority: enhancedTicketData.priority,
        urgency: enhancedTicketData.urgency,
        impact: enhancedTicketData.impact,
        type: enhancedTicketData.type,
        itilcategories_id: enhancedTicketData.itilcategories_id,
        status: enhancedTicketData.status,
      });
      
      // Verificar se temos uma sessão válida
      if (!hasValidSession) {
        console.warn('🎫 [useGLPIExpanded] Sessão inválida - tentando inicializar');
        throw new Error('Sessão GLPI inválida. Tentando reconectar...');
      }
      
      try {
        // A edge function já faz o wrap com "input", então enviamos direto o objeto
        console.log('🎫 [useGLPIExpanded] Enviando dados diretamente (edge function fará o wrap):', JSON.stringify(enhancedTicketData, null, 2));
        
        const response = await makeGLPIRequest('Ticket', {
          method: 'POST',
          body: JSON.stringify(enhancedTicketData)
        });
        
        console.log('🎫 [useGLPIExpanded] Resposta do GLPI proxy:', response);
        return response;
      } catch (error) {
        console.error('🎫 [useGLPIExpanded] Erro na requisição:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log('✅ Ticket criado com sucesso:', result);
      queryClient.invalidateQueries({ queryKey: ['glpi', 'tickets'] });
      
      // Extrair ID do ticket criado se disponível
      const ticketId = result?.[0]?.id || result?.id;
      const successMessage = ticketId 
        ? `Ticket #${ticketId} criado com sucesso no GLPI.`
        : "O ticket foi criado com sucesso no GLPI.";
        
      toast({
        title: "Ticket criado!",
        description: successMessage,
      });
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao criar ticket:', error);
      
      // Melhorar mensagens de erro baseadas no tipo
      let errorMessage = error.message;
      
      if (error.message.includes('ERROR_BAD_ARRAY')) {
        errorMessage = 'Erro no formato dos dados. Verifique os campos obrigatórios.';
      } else if (error.message.includes('ERROR_SESSION_TOKEN_MISSING')) {
        errorMessage = 'Sessão expirada. Será reconectado automaticamente na próxima tentativa.';
      } else if (error.message.includes('ERROR_NOT_FOUND')) {
        errorMessage = 'Endpoint não encontrado. Verifique a configuração do GLPI.';
      }
      
      toast({
        title: "Erro ao criar ticket",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<GLPITicket> }) => {
      return makeGLPIRequest(`tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glpi', 'tickets'] });
      toast({
        title: "Ticket atualizado!",
        description: "O ticket foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar ticket",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: (id: number) => {
      return makeGLPIRequest(`tickets/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glpi', 'tickets'] });
      toast({
        title: "Ticket deletado!",
        description: "O ticket foi deletado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar ticket",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Helper functions e computed values
  const getStatusText = (status: number) => STATUS_MAP[status] || `Status ${status}`;
  const getPriorityText = (priority: number) => PRIORITY_MAP[priority] || `Prioridade ${priority}`;
  const hasValidSession = !!glpiIntegration?.webhook_url;
  const isEnabled = !!glpiIntegration?.is_active;

  return {
    // Dados da integração
    glpiIntegration,
    hasValidSession,
    isEnabled,
    
    // Estado da inicialização
    initSession,
    
    // Queries de dados
    tickets,
    problems,
    changes,
    computers,
    monitors,
    printers,
    networkequipments,
    networkEquipment: networkequipments, // Alias para compatibilidade
    software,
    suppliers,
    contracts,
    users,
    entities,
    locations,
    groups,
    itilCategories,
    requestTypes,
    
    // Mutations
    createTicket,
    updateTicket,
    deleteTicket,
    
    // Helper functions
    getStatusText,
    getPriorityText,
  };
};