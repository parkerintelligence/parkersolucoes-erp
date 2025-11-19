import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface MikrotikTableFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MikrotikTableFilter = ({ value, onChange, placeholder = "Filtrar..." }: MikrotikTableFilterProps) => {
  return (
    <div className="relative w-64">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  );
};
