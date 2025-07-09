
import { useCompanyLinks } from './useCompanyLinks';
import { usePasswords } from '@/hooks/usePasswords';
import { useCompanies } from './useCompanies';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from '@/hooks/use-toast';

export const useLinksExport = () => {
  const { data: passwords = [] } = usePasswords();
  const { data: companies = [] } = useCompanies();

  const exportToPDF = () => {
    try {
      console.log('Iniciando exportação completa para PDF...');
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Configurar fonte
      doc.setFont('helvetica');
      
      // Título principal
      doc.setFontSize(20);
      doc.text('Relatório Completo de Acessos e Senhas', 20, 20);
      
      // Data de geração
      doc.setFontSize(10);
      const now = new Date();
      doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, 20, 30);

      let currentY = 45;

      // Agrupar senhas por empresa
      const companiesWithPasswords = companies.map(company => ({
        ...company,
        links: passwords.filter(p => p.company_id === company.id && p.gera_link),
        passwords: passwords.filter(p => p.company_id === company.id && !p.gera_link)
      })).filter(company => company.links.length > 0 || company.passwords.length > 0);

      // Senhas sem empresa
      const unassignedLinks = passwords.filter(p => !p.company_id && p.gera_link);
      const unassignedPasswords = passwords.filter(p => !p.company_id && !p.gera_link);

      companiesWithPasswords.forEach((company, index) => {
        // Verificar se precisa de nova página
        if (currentY > 150) {
          doc.addPage();
          currentY = 20;
        }

        // Nome da empresa
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`${company.name}`, 20, currentY);
        currentY += 10;

        // Links de Acesso (gera_link = true)
        if (company.links.length > 0) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Links de Acesso:', 20, currentY);
          currentY += 5;

          const linksData = company.links.map(link => [
            link.name || '',
            link.service || '',
            link.url || '',
            link.username || '',
            link.password || '',
            link.notes || ''
          ]);

          const linksHeaders = ['Nome', 'Serviço', 'URL', 'Usuário', 'Senha', 'Notas'];

          (doc as any).autoTable({
            head: [linksHeaders],
            body: linksData,
            startY: currentY,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
            },
            columnStyles: {
              0: { cellWidth: 35 }, // Nome
              1: { cellWidth: 25 }, // Serviço
              2: { cellWidth: 45 }, // URL
              3: { cellWidth: 30 }, // Usuário
              4: { cellWidth: 30 }, // Senha
              5: { cellWidth: 40 }  // Notas
            },
            headStyles: {
              fillColor: [37, 99, 235], // blue-600
              textColor: 255,
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            margin: { left: 20, right: 20 }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Senhas Gerais (gera_link = false)
        if (company.passwords.length > 0) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Senhas Gerais:', 20, currentY);
          currentY += 5;

          const passwordsData = company.passwords.map(pwd => [
            pwd.name || '',
            pwd.service || '',
            pwd.username || '',
            pwd.password || '',
            pwd.url || '',
            pwd.notes || ''
          ]);

          const passwordsHeaders = ['Nome', 'Serviço', 'Usuário', 'Senha', 'URL', 'Notas'];

          (doc as any).autoTable({
            head: [passwordsHeaders],
            body: passwordsData,
            startY: currentY,
            styles: {
              fontSize: 8,
              cellPadding: 2,
              overflow: 'linebreak',
            },
            columnStyles: {
              0: { cellWidth: 35 }, // Nome
              1: { cellWidth: 25 }, // Serviço
              2: { cellWidth: 30 }, // Usuário
              3: { cellWidth: 30 }, // Senha
              4: { cellWidth: 45 }, // URL
              5: { cellWidth: 40 }  // Notas
            },
            headStyles: {
              fillColor: [16, 185, 129], // green-500
              textColor: 255,
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [245, 245, 245]
            },
            margin: { left: 20, right: 20 }
          });

          currentY = (doc as any).lastAutoTable.finalY + 15;
        }
      });

      // Adicionar itens sem empresa se existirem
      if (unassignedLinks.length > 0 || unassignedPasswords.length > 0) {
        if (currentY > 150) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Sem Empresa Definida', 20, currentY);
        currentY += 10;

        // Links sem empresa
        if (unassignedLinks.length > 0) {
          doc.setFontSize(12);
          doc.text('Links de Acesso:', 20, currentY);
          currentY += 5;

          const linksData = unassignedLinks.map(link => [
            link.name || '',
            link.service || '',
            link.url || '',
            link.username || '',
            link.password || '',
            link.notes || ''
          ]);

          (doc as any).autoTable({
            head: [['Nome', 'Serviço', 'URL', 'Usuário', 'Senha', 'Notas']],
            body: linksData,
            startY: currentY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [37, 99, 235], textColor: 255 },
            margin: { left: 20, right: 20 }
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Senhas sem empresa
        if (unassignedPasswords.length > 0) {
          doc.setFontSize(12);
          doc.text('Senhas Gerais:', 20, currentY);
          currentY += 5;

          const passwordsData = unassignedPasswords.map(pwd => [
            pwd.name || '',
            pwd.service || '',
            pwd.username || '',
            pwd.password || '',
            pwd.url || '',
            pwd.notes || ''
          ]);

          (doc as any).autoTable({
            head: [['Nome', 'Serviço', 'Usuário', 'Senha', 'URL', 'Notas']],
            body: passwordsData,
            startY: currentY,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255 },
            margin: { left: 20, right: 20 }
          });
        }
      }

      // Adicionar informações no rodapé de todas as páginas
      const pageCount = (doc as any).internal.getNumberOfPages();
      const totalLinks = passwords.filter(p => p.gera_link).length;
      const totalPasswords = passwords.filter(p => !p.gera_link).length;

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Links: ${totalLinks} | Senhas: ${totalPasswords} | Página ${i} de ${pageCount}`,
          20,
          doc.internal.pageSize.height - 10
        );
      }

      // Salvar o arquivo
      const fileName = `relatorio-completo-${now.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('PDF exportado com sucesso:', fileName);
      
      toast({
        title: "✅ Exportação concluída!",
        description: `Relatório completo exportado com ${totalLinks} links e ${totalPasswords} senhas.`,
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
