
import React from 'react';
import { ScheduledReportsPanel } from '@/components/ScheduledReportsPanel';
import { BaculaReportTestPanel } from '@/components/automation/BaculaReportTestPanel';

const Automation = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6 space-y-6">
        <BaculaReportTestPanel />
        <ScheduledReportsPanel />
      </div>
    </div>
  );
};

export default Automation;
