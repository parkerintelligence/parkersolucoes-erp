import { Check, CheckCheck } from 'lucide-react';

interface ChatwootMessageStatusProps {
  status: 'sent' | 'delivered' | 'read';
  messageType: number;
}

export const ChatwootMessageStatus = ({ status, messageType }: ChatwootMessageStatusProps) => {
  // Only show status for outgoing messages (type 1)
  if (messageType !== 1) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-slate-400" />;
      case 'sent':
      default:
        return <Check className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <span className="inline-flex items-center ml-1">
      {getStatusIcon()}
    </span>
  );
};
