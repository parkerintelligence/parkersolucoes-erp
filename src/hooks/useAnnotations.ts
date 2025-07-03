import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Annotation = Tables<'annotations'>;
type AnnotationInsert = TablesInsert<'annotations'>;
type AnnotationUpdate = TablesUpdate<'annotations'>;

export const useAnnotations = () => {
  return useQuery({
    queryKey: ['annotations'],
    queryFn: async (): Promise<Annotation[]> => {
      const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateAnnotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (annotation: Omit<AnnotationInsert, 'user_id'>): Promise<Annotation> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('annotations')
        .insert({
          ...annotation,
          user_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations'] });
      toast({
        title: "Anotação criada com sucesso!",
        description: "A anotação foi adicionada ao sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar anotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAnnotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AnnotationUpdate }): Promise<Annotation> => {
      const { data, error } = await supabase
        .from('annotations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations'] });
      toast({
        title: "Anotação atualizada!",
        description: "As informações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar anotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAnnotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('annotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations'] });
      toast({
        title: "Anotação removida!",
        description: "A anotação foi removida do sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover anotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};