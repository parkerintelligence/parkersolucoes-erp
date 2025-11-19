import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileDown, FileText, MessageSquare, Table } from "lucide-react";
import { useMikrotikExport, ExportColumn } from "@/hooks/useMikrotikExport";
import { MikrotikWhatsAppDialog } from "./MikrotikWhatsAppDialog";

interface MikrotikExportActionsProps {
  data: any[];
  filteredData: any[];
  columns: ExportColumn[];
  gridTitle: string;
  getSummary: () => string;
}

export const MikrotikExportActions = ({
  data,
  filteredData,
  columns,
  gridTitle,
  getSummary
}: MikrotikExportActionsProps) => {
  const { exportToPDF, exportToExcel } = useMikrotikExport();
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);

  const handleExportPDF = () => {
    exportToPDF({
      data: filteredData,
      columns,
      gridTitle,
      format: 'pdf'
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      data: filteredData,
      columns,
      gridTitle,
      format: 'excel'
    });
  };

  return (
    <>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <Table className="h-4 w-4 mr-2" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setWhatsAppDialogOpen(true)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>

      <MikrotikWhatsAppDialog
        open={whatsAppDialogOpen}
        onOpenChange={setWhatsAppDialogOpen}
        gridTitle={gridTitle}
        data={filteredData}
        summary={getSummary()}
      />
    </>
  );
};
