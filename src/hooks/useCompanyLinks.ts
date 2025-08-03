
import { useState } from 'react';
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePasswords } from '@/hooks/usePasswords';
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
  username?: string;
  password?: string;
  company_id?: string;
  service?: string;
}

export const useCompanyLinks = () => {
  const { data: passwords = [], isLoading } = usePasswords();
  
  // Filtrar apenas senhas que têm gera_link = true e adaptar para o formato esperado
  const links = passwords
    .filter(password => password.gera_link)
    .map(password => ({
      id: password.id,
      client: '', // Será preenchido com o nome da empresa
      name: password.name,
      url: password.url || '',
      description: password.notes || '',
      category: password.service || 'Sistema',
      is_active: true,
      created_at: password.created_at,
      username: password.username,
      password: password.password,
      company_id: password.company_id,
      service: password.service
    })) as CompanyLink[];

  return {
    links,
    isLoading
  };
};
