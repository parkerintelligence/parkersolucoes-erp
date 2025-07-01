
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface ZabbixErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  details?: string;
}

export const ZabbixErrorDialog = ({ isOpen, onClose, error, details }: ZabbixErrorDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle className="text-red-600">
              Erro de Conexão com o Zabbix
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            <div className="space-y-3">
              <div>
                <strong className="text-red-600">Erro:</strong>
                <p className="mt-1 text-red-700 font-medium">{error}</p>
              </div>
              
              {details && (
                <div>
                  <strong className="text-gray-700">Detalhes:</strong>
                  <pre className="mt-1 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded border max-h-64 overflow-y-auto">
{details}
                  </pre>
                </div>
              )}

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <strong className="text-blue-700">Dicas para resolver:</strong>
                <ul className="mt-2 text-sm text-blue-600 space-y-1">
                  <li>• Verifique se a URL base está correta (ex: http://servidor.com/zabbix)</li>
                  <li>• Confirme se o API Token tem as permissões necessárias</li>
                  <li>• Teste se consegue acessar a URL no navegador</li>
                  <li>• Verifique se não há firewall bloqueando a conexão</li>
                  <li>• O proxy resolve problemas de CORS automaticamente</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
