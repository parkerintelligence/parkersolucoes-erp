import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { useMikrotikContext } from '@/contexts/MikrotikContext';

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

export interface MikrotikExportOptions {
  data: any[];
  columns: ExportColumn[];
  gridTitle: string;
  format: 'pdf' | 'excel';
}

export const useMikrotikExport = () => {
  const { toast } = useToast();
  const { selectedClient } = useMikrotikContext();

  const exportToPDF = async (options: MikrotikExportOptions) => {
    try {
      const doc = new jsPDF();
      const clientName = selectedClient?.name || 'Cliente';
      const timestamp = new Date().toLocaleString('pt-BR');

      // Header
      doc.setFontSize(18);
      doc.setTextColor(33, 150, 243);
      doc.text(`MIKROTIK - ${options.gridTitle.toUpperCase()}`, 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Cliente: ${clientName}`, 20, 30);
      doc.text(`Data/Hora: ${timestamp}`, 20, 36);
      doc.text(`Total de registros: ${options.data.length}`, 20, 42);

      // Line separator
      doc.setDrawColor(33, 150, 243);
      doc.setLineWidth(0.5);
      doc.line(20, 46, 190, 46);

      // Table data
      const tableData = options.data.map(row => 
        options.columns.map(col => {
          const value = row[col.key];
          return col.formatter ? col.formatter(value) : (value?.toString() || '-');
        })
      );

      // Generate table
      autoTable(doc, {
        head: [options.columns.map(col => col.label)],
        body: tableData,
        startY: 50,
        styles: { 
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: { 
          fillColor: [33, 150, 243],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${pageCount} - Gerado via Sistema Parker`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save
      const fileName = `mikrotik_${options.gridTitle.toLowerCase().replace(/\s+/g, '_')}_${clientName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({
        title: 'PDF exportado com sucesso',
        description: `Arquivo ${fileName} foi baixado`,
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: 'Erro ao exportar PDF',
        description: 'Não foi possível gerar o arquivo PDF',
        variant: 'destructive',
      });
    }
  };

  const exportToExcel = async (options: MikrotikExportOptions) => {
    try {
      const clientName = selectedClient?.name || 'Cliente';
      const timestamp = new Date().toLocaleString('pt-BR');

      // CSV header with metadata
      const metadata = [
        `MIKROTIK - ${options.gridTitle.toUpperCase()}`,
        `Cliente: ${clientName}`,
        `Data/Hora: ${timestamp}`,
        `Total de registros: ${options.data.length}`,
        '', // Empty line
      ];

      // CSV headers
      const headers = options.columns.map(col => col.label).join(';');

      // CSV rows
      const rows = options.data.map(row =>
        options.columns.map(col => {
          const value = row[col.key];
          const formatted = col.formatter ? col.formatter(value) : (value?.toString() || '-');
          // Escape quotes and wrap in quotes
          return `"${formatted.replace(/"/g, '""')}"`;
        }).join(';')
      );

      // Combine all
      const csv = [...metadata, headers, ...rows].join('\n');

      // Create blob with UTF-8 BOM for Excel compatibility
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });

      // Download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const fileName = `mikrotik_${options.gridTitle.toLowerCase().replace(/\s+/g, '_')}_${clientName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`;
      link.download = fileName;
      link.click();

      toast({
        title: 'Excel exportado com sucesso',
        description: `Arquivo ${fileName} foi baixado`,
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro ao exportar Excel',
        description: 'Não foi possível gerar o arquivo CSV',
        variant: 'destructive',
      });
    }
  };

  return { exportToPDF, exportToExcel };
};
