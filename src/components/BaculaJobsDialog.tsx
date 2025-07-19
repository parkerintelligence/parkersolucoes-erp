import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BaculaConfiguredJobsTable } from '@/components/bacula/BaculaConfiguredJobsTable';
import { Database } from 'lucide-react';

export const BaculaJobsDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
        >
          <Database className="mr-2 h-4 w-4" />
          Jobs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Jobs Cadastrados no Director</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <BaculaConfiguredJobsTable />
        </div>
      </DialogContent>
    </Dialog>
  );
};