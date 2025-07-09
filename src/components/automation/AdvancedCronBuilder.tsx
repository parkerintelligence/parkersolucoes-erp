
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';

interface AdvancedCronBuilderProps {
  value: string;
  onChange: (cronExpression: string) => void;
}

type FrequencyType = 'daily' | 'weekdays' | 'weekly' | 'custom';

const WEEKDAYS = [
  { id: 0, label: 'Dom', name: 'Domingo' },
  { id: 1, label: 'Seg', name: 'Segunda' },
  { id: 2, label: 'Ter', name: 'Terça' },
  { id: 3, label: 'Qua', name: 'Quarta' },
  { id: 4, label: 'Qui', name: 'Quinta' },
  { id: 5, label: 'Sex', name: 'Sexta' },
  { id: 6, label: 'Sáb', name: 'Sábado' },
];

export const AdvancedCronBuilder = ({ value, onChange }: AdvancedCronBuilderProps) => {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Segunda a Sexta por padrão

  console.log('⏰ AdvancedCronBuilder - Render:', {
    value,
    hour,
    minute,
    frequency,
    selectedDays
  });

  // Parse existing cron expression on mount or when value changes
  useEffect(() => {
    console.log('⏰ Parsing cron expression:', value);
    if (value && value !== '') {
      parseCronExpression(value);
    }
  }, [value]);

  // Generate cron expression when values change
  useEffect(() => {
    const cronExpression = generateCronExpression();
    console.log('⏰ Generated cron expression:', cronExpression);
    onChange(cronExpression);
  }, [hour, minute, frequency, selectedDays, onChange]);

  const parseCronExpression = (cron: string) => {
    console.log('🔍 Parsing cron:', cron);
    const parts = cron.split(' ');
    if (parts.length >= 5) {
      const cronMinute = parseInt(parts[0]) || 0;
      const cronHour = parseInt(parts[1]) || 9;
      const dayPart = parts[4];

      console.log('🔍 Parsed parts:', {
        minute: cronMinute,
        hour: cronHour,
        dayPart
      });

      setMinute(cronMinute);
      setHour(cronHour);

      if (dayPart === '*') {
        setFrequency('daily');
      } else if (dayPart === '1-5') {
        setFrequency('weekdays');
        setSelectedDays([1, 2, 3, 4, 5]);
      } else if (dayPart.includes(',')) {
        setFrequency('custom');
        const days = dayPart.split(',').map(d => parseInt(d)).filter(d => !isNaN(d));
        setSelectedDays(days);
      } else if (!isNaN(parseInt(dayPart))) {
        // Single day
        setFrequency('custom');
        setSelectedDays([parseInt(dayPart)]);
      }
    }
  };

  const generateCronExpression = (): string => {
    let dayPattern = '*';
    
    switch (frequency) {
      case 'daily':
        dayPattern = '*';
        break;
      case 'weekdays':
        dayPattern = '1-5';
        break;
      case 'custom':
        if (selectedDays.length > 0) {
          dayPattern = selectedDays.sort((a, b) => a - b).join(',');
        }
        break;
    }

    const cronExpression = `${minute} ${hour} * * ${dayPattern}`;
    console.log('🔄 Generated cron:', cronExpression);
    return cronExpression;
  };

  const getFrequencyDescription = (): string => {
    switch (frequency) {
      case 'daily':
        return 'Todos os dias';
      case 'weekdays':
        return 'Segunda a Sexta';
      case 'custom':
        if (selectedDays.length === 0) return 'Nenhum dia selecionado';
        if (selectedDays.length === 7) return 'Todos os dias';
        const dayNames = selectedDays.map(day => WEEKDAYS[day]?.label || '?');
        return dayNames.join(', ');
      default:
        return '';
    }
  };

  const getNextExecutionPreview = (): string => {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(hour, minute, 0, 0);

    // Se o horário já passou hoje, calcular para o próximo dia válido
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    // Para frequências específicas, encontrar o próximo dia válido
    if (frequency === 'weekdays') {
      while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (frequency === 'custom' && selectedDays.length > 0) {
      let attempts = 0;
      while (!selectedDays.includes(nextRun.getDay()) && attempts < 7) {
        nextRun.setDate(nextRun.getDate() + 1);
        attempts++;
      }
    }

    return nextRun.toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(id => id !== dayId);
      } else {
        return [...prev, dayId].sort();
      }
    });
  };

  const handleHourChange = (newHour: string) => {
    const hourValue = parseInt(newHour) || 0;
    const validHour = Math.max(0, Math.min(23, hourValue));
    console.log('⏰ Hour changed:', validHour);
    setHour(validHour);
  };

  const handleMinuteChange = (newMinute: string) => {
    const minuteValue = parseInt(newMinute) || 0;
    const validMinute = Math.max(0, Math.min(59, minuteValue));
    console.log('⏰ Minute changed:', validMinute);
    setMinute(validMinute);
  };

  return (
    <div className="space-y-6">
      {/* Horário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            Horário de Envio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="hour">Hora</Label>
              <Input
                id="hour"
                type="number"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => handleHourChange(e.target.value)}
                className="w-20 text-center"
              />
            </div>
            <div className="text-2xl font-bold text-muted-foreground">:</div>
            <div className="space-y-2">
              <Label htmlFor="minute">Minuto</Label>
              <Input
                id="minute"
                type="number"
                min="0"
                max="59"
                value={minute}
                onChange={(e) => handleMinuteChange(e.target.value)}
                className="w-20 text-center"
              />
            </div>
            <div className="ml-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Frequência de Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Repetição</Label>
            <Select value={frequency} onValueChange={(value: FrequencyType) => {
              console.log('⏰ Frequency changed:', value);
              setFrequency(value);
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekdays">Dias Úteis (Seg-Sex)</SelectItem>
                <SelectItem value="custom">Dias Específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'custom' && (
            <div className="space-y-3">
              <Label>Selecione os dias da semana:</Label>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day.id}
                    className="flex flex-col items-center space-y-2"
                  >
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={selectedDays.includes(day.id)}
                      onCheckedChange={() => toggleDay(day.id)}
                    />
                    <Label
                      htmlFor={`day-${day.id}`}
                      className="text-xs font-medium cursor-pointer"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-sm text-amber-600">
                  ⚠️ Selecione pelo menos um dia da semana
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">Resumo do Agendamento:</span>
              <Badge className="bg-blue-100 text-blue-800">
                {getFrequencyDescription()} às {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
              </Badge>
            </div>
            <div className="text-sm text-blue-700">
              <strong>Próximo envio:</strong> {getNextExecutionPreview()}
            </div>
            <div className="text-xs text-blue-600 font-mono bg-blue-100 p-2 rounded">
              Expressão Cron: {generateCronExpression()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
