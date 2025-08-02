import React from 'react';
import { GLPIKPIHeader } from './glpi/GLPIKPIHeader';
import { GLPITicketMetrics } from './glpi/GLPITicketMetrics';
import { GLPIAssetMetrics } from './glpi/GLPIAssetMetrics';
import { GLPIOrganizationMetrics } from './glpi/GLPIOrganizationMetrics';
import { GLPIITILMetrics } from './glpi/GLPIITILMetrics';
import { useGLPIExpanded } from '@/hooks/useGLPIExpanded';

export const GLPIDashboard = () => {
  const { tickets } = useGLPIExpanded();
  
  // Mock data structure to satisfy component requirements
  const mockKPIData = {
    tickets: tickets.data?.length || 0,
    problems: [],
    changes: []
  };

  const mockTicketMetricsData = {
    tickets: tickets.data || []
  };

  const mockAssetMetricsData = {
    computers: [],
    monitors: [],
    printers: [],
    networkEquipment: [],
    software: []
  };

  const mockOrganizationMetricsData = {
    users: [],
    entities: [],
    locations: [],
    suppliers: [],
    contracts: []
  };

  const mockITILMetricsData = {
    problems: [],
    changes: [],
    tickets: tickets.data || []
  };

  return (
    <div className="space-y-6">
      <GLPIKPIHeader {...mockKPIData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GLPITicketMetrics {...mockTicketMetricsData} />
        <GLPIAssetMetrics {...mockAssetMetricsData} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GLPIOrganizationMetrics {...mockOrganizationMetricsData} />
        <GLPIITILMetrics {...mockITILMetricsData} />
      </div>
    </div>
  );
};