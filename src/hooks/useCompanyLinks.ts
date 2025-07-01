
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface CompanyLink {
  id: string;
  client: string;
  name: string;
  url: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

const mockLinks: CompanyLink[] = [
  { 
    id: '1', 
    client: 'Empresa A', 
    name: 'Portal Administrativo', 
    url: 'https://admin.empresaa.com', 
    description: 'Painel principal de administração', 
    category: 'Admin',
    is_active: true,
    created_at: '2024-01-01'
  },
  { 
    id: '2', 
    client: 'Empresa A', 
    name: 'Sistema ERP', 
    url: 'https://erp.empresaa.com', 
    description: 'Sistema de gestão empresarial', 
    category: 'Sistema',
    is_active: true,
    created_at: '2024-01-02'
  },
  { 
    id: '3', 
    client: 'Empresa B', 
    name: 'Sistema de Vendas', 
    url: 'https://vendas.empresab.com', 
    description: 'Sistema de gestão de vendas', 
    category: 'Vendas',
    is_active: true,
    created_at: '2024-01-03'
  },
  { 
    id: '4', 
    client: 'Empresa B', 
    name: 'CRM', 
    url: 'https://crm.empresab.com', 
    description: 'Gestão de relacionamento com cliente', 
    category: 'CRM',
    is_active: true,
    created_at: '2024-01-04'
  },
  { 
    id: '5', 
    client: 'Empresa C', 
    name: 'Monitoramento', 
    url: 'https://monitor.empresac.com', 
    description: 'Dashboard de monitoramento', 
    category: 'Monitor',
    is_active: true,
    created_at: '2024-01-05'
  },
];

export const useCompanyLinks = () => {
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['company-links'],
    queryFn: async (): Promise<CompanyLink[]> => {
      console.log('Carregando links das empresas...');
      // Simular delay de carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Links carregados:', mockLinks.length, 'links');
      return mockLinks;
    },
  });

  const createLink = useMutation({
    mutationFn: async (newLink: Omit<CompanyLink, 'id' | 'created_at'>) => {
      console.log('Criando novo link:', newLink);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        ...newLink,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-links'] });
      toast({
        title: "Link criado!",
        description: "O link foi adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar link",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CompanyLink> }) => {
      console.log('Atualizando link:', id, updates);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-links'] });
      toast({
        title: "Link atualizado!",
        description: "O link foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar link",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      console.log('Removendo link:', id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-links'] });
      toast({
        title: "Link removido!",
        description: "O link foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover link",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  return {
    links,
    isLoading,
    createLink,
    updateLink,
    deleteLink,
  };
};
