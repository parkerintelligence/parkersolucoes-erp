
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Database } from 'lucide-react';

interface WasabiBucketSelectorProps {
  buckets: Array<{ name: string; creationDate: string }>;
  selectedBucket: string;
  onBucketChange: (bucketName: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const WasabiBucketSelector = ({ 
  buckets, 
  selectedBucket, 
  onBucketChange, 
  isLoading = false,
  className 
}: WasabiBucketSelectorProps) => {
  return (
    <div className={className}>
      <Label htmlFor="bucket-selector" className="text-white flex items-center gap-2 mb-2">
        <Database className="h-4 w-4" />
        Selecionar Bucket
      </Label>
      <Select 
        value={selectedBucket} 
        onValueChange={onBucketChange}
        disabled={isLoading || buckets.length === 0}
      >
        <SelectTrigger 
          id="bucket-selector"
          className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
        >
          <SelectValue placeholder={
            buckets.length === 0 
              ? "Nenhum bucket disponível" 
              : "Escolha um bucket para visualizar arquivos..."
          } />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {buckets.map((bucket) => (
            <SelectItem 
              key={bucket.name} 
              value={bucket.name}
              className="text-white hover:bg-gray-700"
            >
              {bucket.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
