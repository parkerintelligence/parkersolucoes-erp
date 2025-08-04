"use client"

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Password = Tables<'passwords'>;
type PasswordInsert = TablesInsert<'passwords'>;
type PasswordUpdate = TablesUpdate<'passwords'>;

export const usePasswords = () => {
  return useQuery({
    queryKey: ['passwords'],
    queryFn: async (): Promise<Password[]> => {
      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreatePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (password: Omit<PasswordInsert, 'user_id'>): Promise<Password> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('passwords')
        .insert({
          ...password,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords'] });
      toast({
        title: "Senha criada com sucesso!",
        description: "A senha foi adicionada ao cofre.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PasswordUpdate }): Promise<Password> => {
      const { data, error } = await supabase
        .from('passwords')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords'] });
      toast({
        title: "Senha atualizada!",
        description: "As informações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('passwords')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passwords'] });
      toast({
        title: "Senha removida!",
        description: "A senha foi removida do cofre.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};