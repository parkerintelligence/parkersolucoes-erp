
import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface ScheduleFrequencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'Uma vez' },
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'custom', label: 'Personalizado' }
];

const DAYS_OF_WEEK = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda' },
  { value: '2', label: 'Terça' },
  { value: '3', label: 'Quarta' },
  { value: '4', label: 'Quinta' },
  { value: '5', label: 'Sexta' },
  { value: '6', label: 'Sábado' }
];

export const ScheduleFrequencySelector = ({ value, onChange, className }: ScheduleFrequencySelectorProps) => {
  const [frequency, setFrequency] = useState('daily');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [customCron, setCustomCron] = useState('');

  const generateCronExpression = useCallback(() => {
    switch (frequency) {
      case 'once':
        // Para execução única, usamos uma data específica (pode ser ajustado)
        return `${minute} ${hour} * * *`;
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        const days = selectedDays.join(',');
        return `${minute} ${hour} * * ${days}`;
      case 'monthly':
        return `${minute} ${hour} ${dayOfMonth} * *`;
      case 'custom':
        return customCron;
      default:
        return `${minute} ${hour} * * *`;
    }
  }, [frequency, hour, minute, selectedDays, dayOfMonth, customCron]);

  useEffect(() => {
    const cronExpr = generateCronExpression();
    onChange(cronExpr);
  }, [generateCronExpression, onChange]);

  const handleDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setSelectedDays(prev => [...prev, day].sort());
    } else {
      setSelectedDays(prev => prev.filter(d => d !== day));
    }
  };

  return (
    <div className={className}>
      <Label className="text-white">Frequência de Execução</Label>
      
      <div className="space-y-4 mt-2">
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-600 border-gray-500">
            {FREQUENCY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-500">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-white text-sm">Hora</Label>
            <Input
              type="number"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value) || 0)}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>
          <div>
            <Label className="text-white text-sm">Minuto</Label>
            <Input
              type="number"
              min="0"
              max="59"
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value) || 0)}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>
        </div>

        {frequency === 'weekly' && (
          <div>
            <Label className="text-white text-sm">Dias da Semana</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedDays.includes(day.value)}
                    onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                    className="border-gray-500"
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-white text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {frequency === 'monthly' && (
          <div>
            <Label className="text-white text-sm">Dia do Mês</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>
        )}

        {frequency === 'custom' && (
          <div>
            <Label className="text-white text-sm">Expressão Cron Personalizada</Label>
            <Input
              value={customCron}
              onChange={(e) => setCustomCron(e.target.value)}
              placeholder="0 9 * * *"
              className="bg-gray-600 border-gray-500 text-white"
            />
          </div>
        )}

        <div className="text-xs text-gray-400">
          Expressão gerada: <code className="bg-gray-700 px-1 rounded">{generateCronExpression()}</code>
        </div>
      </div>
    </div>
  );
};
