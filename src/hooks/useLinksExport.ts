
import { useCompanyLinks } from './useCompanyLinks';
import { useCompanies } from './useCompanies';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';

export const useLinksExport = () => {
  const { links } = useCompanyLinks();
  const { data: companies = [] } = useCompanies();

  const exportToPDF = () => {
    try {
      console.log('Iniciando exportação de links para PDF...');
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Configurar fonte
      doc.setFont('helvetica');
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório de Links de Acesso', 20, 20);
      
      // Data de geração
      doc.setFontSize(10);
      const now = new Date();
      doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, 20, 30);
      
      // Preparar dados para a tabela
      const tableData = links.map(link => {
        const company = companies.find(c => c.id === link.company_id);
        return [
          link.name || '',
          company?.name || 'Sem empresa',
          link.service || '',
          link.url || '',
          link.username || '',
          link.password || '',
          link.description || ''
        ];
      });

      // Cabeçalhos da tabela
      const headers = [
        'Nome',
        'Empresa', 
        'Serviço',
        'URL',
        'Usuário',
        'Senha',
        'Descrição'
      ];

      // Adicionar tabela ao PDF
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Nome
          1: { cellWidth: 35 }, // Empresa
          2: { cellWidth: 25 }, // Serviço
          3: { cellWidth: 50 }, // URL
          4: { cellWidth: 30 }, // Usuário
          5: { cellWidth: 30 }, // Senha
          6: { cellWidth: 50 }  // Descrição
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 10, right: 10 },
        tableWidth: 'auto'
      });

      // Adicionar informações no rodapé
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Total de links: ${links.length} | Página ${i} de ${pageCount}`,
          20,
          doc.internal.pageSize.height - 10
        );
      }

      // Salvar o arquivo
      const fileName = `links-acesso-${now.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('PDF exportado com sucesso:', fileName);
      
      toast({
        title: "✅ Exportação concluída!",
        description: `${links.length} links exportados para PDF com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "❌ Erro na exportação",
        description: "Ocorreu um erro ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return {
    exportToPDF
  };
};
