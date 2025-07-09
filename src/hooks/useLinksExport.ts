
import { useCompanyLinks } from './useCompanyLinks';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from './useCompanies';
import { toast } from '@/hooks/use-toast';

export const useLinksExport = () => {
  const { data: passwords = [] } = usePasswords();
  const { data: companies = [] } = useCompanies();

  const exportToPDF = async () => {
    try {
      console.log('🔄 Iniciando exportação de links para PDF...');
      
      // Filtrar apenas links (gera_link = true)
      const links = passwords.filter(password => password.gera_link);
      
      console.log('📊 Dados encontrados:', { 
        totalPasswords: passwords.length, 
        totalLinks: links.length, 
        companies: companies.length 
      });
      
      if (links.length === 0) {
        toast({
          title: "⚠️ Nenhum link encontrado",
          description: "Não há links de acesso para exportar. Configure senhas com 'Gera Link' ativado.",
          variant: "destructive"
        });
        return;
      }

      // Importação dinâmica do jsPDF
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Configurar fonte
      doc.setFont('helvetica');
      
      // Título principal
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('Relatório de Links de Acesso', 20, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const now = new Date();
      const dataFormatada = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Gerado em: ${dataFormatada}`, 20, 28);

      let currentY = 40;

      // Agrupar links por empresa
      const companiesWithLinks = companies.map(company => ({
        ...company,
        links: links.filter(link => link.company_id === company.id)
      })).filter(company => company.links.length > 0);

      // Links sem empresa
      const unassignedLinks = links.filter(link => !link.company_id);

      console.log('📈 Agrupamento:', {
        companiesWithLinks: companiesWithLinks.length,
        unassignedLinks: unassignedLinks.length
      });

      // Processar empresas com links
      for (const company of companiesWithLinks) {
        console.log(`📋 Processando empresa: ${company.name} (${company.links.length} links)`);
        
        // Verificar se precisa de nova página
        if (currentY > 160) {
          doc.addPage();
          currentY = 20;
        }

        // Nome da empresa
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(company.name, 20, currentY);
        currentY += 8;

        // Dados dos links da empresa
        const linksData = company.links.map(link => [
          link.name || 'Sem nome',
          link.service || 'Não especificado',
          link.url || 'Não informado',
          link.username || 'Não informado',
          link.password || 'Não informado',
          (link.notes || '').substring(0, 50) + (link.notes && link.notes.length > 50 ? '...' : '')
        ]);

        try {
          (doc as any).autoTable({
            head: [['Nome', 'Serviço', 'URL', 'Usuário', 'Senha', 'Observações']],
            body: linksData,
            startY: currentY,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              valign: 'middle'
            },
            columnStyles: {
              0: { cellWidth: 30 }, // Nome
              1: { cellWidth: 25 }, // Serviço  
              2: { cellWidth: 50 }, // URL
              3: { cellWidth: 25 }, // Usuário
              4: { cellWidth: 25 }, // Senha
              5: { cellWidth: 35 }  // Observações
            },
            headStyles: {
              fillColor: [37, 99, 235], // Azul
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252] // Cinza claro
            },
            margin: { left: 20, right: 20 },
            tableWidth: 'auto'
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        } catch (error) {
          console.error('❌ Erro ao criar tabela da empresa:', company.name, error);
          currentY += 30;
        }
      }

      // Processar links sem empresa
      if (unassignedLinks.length > 0) {
        console.log('📋 Processando links sem empresa');
        
        if (currentY > 160) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Links sem Empresa Definida', 20, currentY);
        currentY += 8;

        const unassignedData = unassignedLinks.map(link => [
          link.name || 'Sem nome',
          link.service || 'Não especificado',
          link.url || 'Não informado',
          link.username || 'Não informado',
          link.password || 'Não informado',
          (link.notes || '').substring(0, 50) + (link.notes && link.notes.length > 50 ? '...' : '')
        ]);

        try {
          (doc as any).autoTable({
            head: [['Nome', 'Serviço', 'URL', 'Usuário', 'Senha', 'Observações']],
            body: unassignedData,
            startY: currentY,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
              valign: 'middle'
            },
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 25 },
              2: { cellWidth: 50 },
              3: { cellWidth: 25 },
              4: { cellWidth: 25 },
              5: { cellWidth: 35 }
            },
            headStyles: {
              fillColor: [16, 185, 129], // Verde
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            },
            margin: { left: 20, right: 20 }
          });
        } catch (error) {
          console.error('❌ Erro ao criar tabela de links sem empresa:', error);
        }
      }

      // Adicionar rodapé em todas as páginas
      const pageCount = (doc as any).internal.getNumberOfPages();
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        // Estatísticas
        const stats = `Total de Links: ${links.length} | Empresas: ${companiesWithLinks.length}`;
        doc.text(stats, 20, doc.internal.pageSize.height - 10);
        
        // Paginação
        const pageInfo = `Página ${i} de ${pageCount}`;
        doc.text(pageInfo, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
      }

      // Salvar o arquivo
      const fileName = `links-acesso-${now.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('✅ PDF de links exportado com sucesso:', fileName);
      
      toast({
        title: "✅ Exportação concluída!",
        description: `${links.length} links de acesso exportados com sucesso.`,
      });

    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      toast({
        title: "❌ Erro na exportação",
        description: `Erro ao gerar PDF: ${error?.message || 'Erro desconhecido'}`,
        variant: "destructive"
      });
    }
  };

  return {
    exportToPDF
  };
};
