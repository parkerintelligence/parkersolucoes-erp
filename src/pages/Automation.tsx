
import * as React from 'react';
import { ScheduledReportsPanel } from '@/components/ScheduledReportsPanel';
import { BaculaDailyReportTester } from '@/components/BaculaDailyReportTester';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Automation = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto p-6">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="reports">Relatórios Agendados</TabsTrigger>
            <TabsTrigger value="bacula-test">Teste Bacula</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports">
            <ScheduledReportsPanel />
          </TabsContent>
          
          <TabsContent value="bacula-test">
            <BaculaDailyReportTester />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Automation;
