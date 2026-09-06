import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BaculaStatusCards } from '@/components/BaculaStatusCards';
import { BaculaAdvancedStats } from '@/components/BaculaAdvancedStats';
import { BarChart3 } from 'lucide-react';

interface BaculaAnalysisDialogProps {
  jobs: any[];
}

export const BaculaAnalysisDialog: React.FC<BaculaAnalysisDialogProps> = ({ jobs }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-secondary border-border text-muted-foreground hover:bg-muted"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Análise
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Análise Estatística dos Jobs</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <BaculaStatusCards />
          <BaculaAdvancedStats jobs={jobs} />
        </div>
      </DialogContent>
    </Dialog>
  );
};