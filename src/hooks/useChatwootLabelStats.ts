import { useMemo } from 'react';
import { ChatwootConversation } from './useChatwootAPI';
import { useChatwootLabels } from './useChatwootLabels';

export interface ChatwootLabel {
  id: number;
  title: string;
  description: string;
  color: string;
}

export interface LabelStats {
  label: string;
  labelObject: ChatwootLabel;
  totalConversations: number;
  openConversations: number;
  pendingConversations: number;
  resolvedConversations: number;
  percentage: number;
}

export const useChatwootLabelStats = (
  conversations: ChatwootConversation[] | undefined,
  integrationId: string | undefined
) => {
  const { labels: availableLabels, isLoadingLabels } = useChatwootLabels(integrationId);

  const labelStats = useMemo(() => {
    if (!conversations || !availableLabels || availableLabels.length === 0) {
      return [];
    }

    const totalConversations = conversations.length;

    return availableLabels
      .map(label => {
        const conversationsWithLabel = conversations.filter(
          conv => conv.labels?.includes(label.title)
        );

        return {
          label: label.title,
          labelObject: label,
          totalConversations: conversationsWithLabel.length,
          openConversations: conversationsWithLabel.filter(c => c.status === 'open').length,
          pendingConversations: conversationsWithLabel.filter(c => c.status === 'pending').length,
          resolvedConversations: conversationsWithLabel.filter(c => c.status === 'resolved').length,
          percentage: totalConversations > 0 ? (conversationsWithLabel.length / totalConversations) * 100 : 0
        };
      })
      .filter(stat => stat.totalConversations > 0)
      .sort((a, b) => b.totalConversations - a.totalConversations);
  }, [conversations, availableLabels]);

  return {
    labelStats,
    isLoading: isLoadingLabels
  };
};
