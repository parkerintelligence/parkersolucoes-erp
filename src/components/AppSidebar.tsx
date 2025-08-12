import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Settings, Calculator, FileText, Headphones, Activity, HardDrive, Lock, Link, MessageCircle, Calendar, Shield, Cloud, Notebook, Database, Monitor, Kanban, AlertTriangle } from 'lucide-react';

export function AppSidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white p-4">
      <h2>Sidebar Test</h2>
      <p>React is working here!</p>
    </div>
  );
}