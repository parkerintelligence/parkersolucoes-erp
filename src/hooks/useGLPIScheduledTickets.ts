"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GLPIScheduledTicket {
  id: string;
  user_id: string;
  name: string;
  title: string;
  content: string;
  priority: number;
  urgency: number;
  impact: number;
  type: number;
  category_id?: number;
  requester_user_id?: number;
  assign_user_id?: number;
  assign_group_id?: number;
  entity_id: number;
  cron_expression: string;
  is_active: boolean;
  last_execution?: string;
  next_execution?: string;
  execution_count: number;
  settings?: any;
  created_at: string;
  updated_at: string;
}

export const useGLPIScheduledTickets = () => {
  return useQuery({
    queryKey: ['glpi-scheduled-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glpi_scheduled_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar agendamentos GLPI:', error);
        throw error;
      }
      
      return data as GLPIScheduledTicket[];
    },
  });
};

export const useCreateGLPIScheduledTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticket: Omit<GLPIScheduledTicket, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_execution' | 'next_execution'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('glpi_scheduled_tickets')
        .insert({
          ...ticket,
          user_id: userData.user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glpi-scheduled-tickets'] });
      toast({
        title: "Agendamento criado!",
        description: "Chamado agendado no GLPI com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateGLPIScheduledTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GLPIScheduledTicket> }) => {
      const { data, error } = await supabase
        .from('glpi_scheduled_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glpi-scheduled-tickets'] });
      toast({
        title: "Agendamento atualizado!",
        description: "Chamado agendado atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteGLPIScheduledTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('glpi_scheduled_tickets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glpi-scheduled-tickets'] });
      toast({
        title: "Agendamento removido!",
        description: "Chamado agendado removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover agendamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};