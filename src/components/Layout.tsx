import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { TopHeader } from '@/components/TopHeader';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useWebhookNotifications } from '@/hooks/useWebhookNotifications';
import { WebhookEventDetailDialog } from '@/components/WebhookEventDetailDialog';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [webhookLogId, setWebhookLogId] = useState<string | null>(null);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);

  const handleViewEvent = useCallback((logId: string) => {
    setWebhookLogId(logId);
    setWebhookDialogOpen(true);
  }, []);

  const notificationOptions = useMemo(() => ({ onViewEvent: handleViewEvent }), [handleViewEvent]);
  useWebhookNotifications(notificationOptions);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center animate-pulse glow-primary">
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0 flex flex-col transition-all duration-200 md:ml-0">
          <TopHeader />
          <main className="flex-1 overflow-auto">
            <div className="container-responsive py-4 sm:py-6 lg:py-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <WebhookEventDetailDialog
        open={webhookDialogOpen}
        onOpenChange={setWebhookDialogOpen}
        logId={webhookLogId}
      />
    </SidebarProvider>
  );
};
