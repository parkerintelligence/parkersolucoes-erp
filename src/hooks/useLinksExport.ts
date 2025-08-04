
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';

interface LinkWithCompany {
  id: string;
  name: string;
  url: string;
  username: string | null;
  password: string | null;
  service: string | null;
  companies: {
    name: string;
  } | null;
}

export const useLinksExport = () => {
  return useMutation({
    mutationFn: async () => {
      console.log('🔄 Iniciando exportação de links para PDF...');
      
      const { data: links, error } = await supabase
        .from('passwords')
        .select(`
          id,
          name,
          url,
          username,
          password,
          service,
          companies (
            name
          )
        `)
        .eq('gera_link', true)
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar links:', error);
        throw error;
      }

      console.log(`✅ ${links?.length || 0} links encontrados`);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Configurar fonte
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Links das Empresas', 20, 20);

      // Data de geração
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);

      // Preparar dados para a tabela
      const tableData = (links as LinkWithCompany[]).map(link => [
        link.companies?.name || 'Empresa não informada',
        link.name || 'Nome não informado',
        link.url || 'URL não informada',
        link.username || 'Usuário não informado',
        link.password || 'Senha não informada',
        link.service || 'Serviço não informado'
      ]);

      // Configurar tabela
      autoTable(doc, {
        head: [['Empresa', 'Nome', 'URL', 'Usuário', 'Senha', 'Serviço']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Empresa
          1: { cellWidth: 30 }, // Nome
          2: { cellWidth: 40 }, // URL
          3: { cellWidth: 25 }, // Usuário
          4: { cellWidth: 25 }, // Senha
          5: { cellWidth: 25 }  // Serviço
        },
        margin: { top: 40, right: 10, bottom: 20, left: 10 },
        theme: 'striped'
      });

      // Adicionar rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
      }

      // Salvar o PDF
      const fileName = `links_empresas_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('✅ PDF gerado com sucesso:', fileName);
      
      return {
        success: true,
        message: 'PDF gerado com sucesso!',
        fileName
      };
    },
    onSuccess: (data) => {
      toast({
        title: "Exportação concluída!",
        description: `${data.message} Arquivo: ${data.fileName}`,
      });
    },
    onError: (error) => {
      console.error('❌ Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};
