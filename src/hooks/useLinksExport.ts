
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
      console.log('📊 Debug - Estado inicial:', { 
        totalPasswords: passwords.length, 
        companies: companies.length,
        passwordsWithLinks: passwords.filter(p => p.gera_link).length
      });
      
      // Validação prévia dos dados
      if (!passwords || passwords.length === 0) {
        console.warn('⚠️ Nenhuma senha encontrada no sistema');
        toast({
          title: "⚠️ Dados não encontrados",
          description: "Não há senhas cadastradas no sistema para exportar.",
          variant: "destructive"
        });
        return;
      }
      
      // Filtrar apenas links (gera_link = true)
      const links = passwords.filter(password => password.gera_link);
      
      console.log('📊 Análise detalhada dos dados:', { 
        totalPasswords: passwords.length, 
        totalLinks: links.length, 
        companies: companies.length,
        linksWithUrl: links.filter(l => l.url).length,
        linksWithCredentials: links.filter(l => l.username && l.password).length
      });
      
      if (links.length === 0) {
        console.warn('⚠️ Nenhum link encontrado (gera_link = true)');
        toast({
          title: "⚠️ Nenhum link encontrado",
          description: "Não há links de acesso para exportar. Configure senhas com 'Gera Link' ativado.",
          variant: "destructive"
        });
        return;
      }

      // Validar se há dados mínimos para exportar
      const linksWithData = links.filter(link => link.name && (link.url || link.username || link.password));
      if (linksWithData.length === 0) {
        console.warn('⚠️ Links encontrados mas sem dados suficientes');
        toast({
          title: "⚠️ Dados insuficientes",
          description: "Os links encontrados não possuem informações suficientes para exportar.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Validação passou, iniciando importação do jsPDF...');

      // Importação dinâmica do jsPDF
      const { default: jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      console.log('✅ jsPDF carregado, criando documento...');

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

      console.log('📈 Agrupamento detalhado:', {
        companiesWithLinks: companiesWithLinks.length,
        unassignedLinks: unassignedLinks.length,
        totalLinksToExport: companiesWithLinks.reduce((acc, c) => acc + c.links.length, 0) + unassignedLinks.length
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

        // Dados dos links da empresa com validação
        const linksData = company.links.map(link => {
          const linkData = [
            link.name || 'Sem nome',
            link.service || 'Não especificado',
            link.url || 'Não informado',
            link.username || 'Não informado',
            link.password || 'Não informado',
            (link.notes || '').substring(0, 50) + (link.notes && link.notes.length > 50 ? '...' : '')
          ];
          
          console.log(`  📄 Link processado: ${link.name} - URL: ${link.url ? 'OK' : 'VAZIO'}`);
          return linkData;
        });

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
          console.log(`✅ Tabela da empresa ${company.name} criada com sucesso`);
        } catch (error) {
          console.error('❌ Erro ao criar tabela da empresa:', company.name, error);
          currentY += 30;
        }
      }

      // Processar links sem empresa
      if (unassignedLinks.length > 0) {
        console.log(`📋 Processando ${unassignedLinks.length} links sem empresa`);
        
        if (currentY > 160) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text('Links sem Empresa Definida', 20, currentY);
        currentY += 8;

        const unassignedData = unassignedLinks.map(link => {
          console.log(`  📄 Link sem empresa: ${link.name} - URL: ${link.url ? 'OK' : 'VAZIO'}`);
          return [
            link.name || 'Sem nome',
            link.service || 'Não especificado',
            link.url || 'Não informado',
            link.username || 'Não informado',
            link.password || 'Não informado',
            (link.notes || '').substring(0, 50) + (link.notes && link.notes.length > 50 ? '...' : '')
          ];
        });

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
          
          console.log('✅ Tabela de links sem empresa criada com sucesso');
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
      console.log('📊 Estatísticas finais:', {
        totalPages: pageCount,
        linksExportados: links.length,
        empresasComLinks: companiesWithLinks.length,
        linksSemEmpresa: unassignedLinks.length
      });
      
      toast({
        title: "✅ Exportação concluída!",
        description: `${links.length} links de acesso exportados com sucesso em ${pageCount} página(s).`,
      });

    } catch (error) {
      console.error('❌ Erro crítico na exportação:', error);
      console.error('❌ Stack trace:', error.stack);
      toast({
        title: "❌ Erro na exportação",
        description: `Erro detalhado: ${error?.message || 'Erro desconhecido'}. Verifique os logs do console.`,
        variant: "destructive"
      });
    }
  };

  return {
    exportToPDF
  };
};
