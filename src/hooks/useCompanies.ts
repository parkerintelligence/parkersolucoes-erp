
import React from 'react';
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useCompanies = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<Company[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching companies for user:', user.email);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      console.log('Companies fetched successfully:', data?.length || 0, 'companies');
      return data || [];
    },
    enabled: !!user,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Creating company:', company, 'for user:', user.id);

      const { data, error } = await supabase
        .from('companies')
        .insert([{
          ...company,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating company:', error);
        throw error;
      }

      console.log('Company created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa criada com sucesso!",
        description: "A empresa foi adicionada ao sistema.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating company:', error);
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...company }: Partial<Company> & { id: string }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Updating company:', id, company);

      const { data, error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company:', error);
        throw error;
      }

      console.log('Company updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa atualizada com sucesso!",
        description: "As informações da empresa foram atualizadas.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating company:', error);
      toast({
        title: "Erro ao atualizar empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Deleting company:', id);

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting company:', error);
        throw error;
      }

      console.log('Company deleted successfully:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa excluída com sucesso!",
        description: "A empresa foi removida do sistema.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro ao excluir empresa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });
};
