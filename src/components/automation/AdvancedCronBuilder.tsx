
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

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

const QUICK_TIMES = [
  { label: '06:00', hour: 6, minute: 0 },
  { label: '08:00', hour: 8, minute: 0 },
  { label: '09:00', hour: 9, minute: 0 },
  { label: '12:00', hour: 12, minute: 0 },
  { label: '14:00', hour: 14, minute: 0 },
  { label: '18:00', hour: 18, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
  { label: '22:00', hour: 22, minute: 0 },
];

export const AdvancedCronBuilder = ({ value, onChange }: AdvancedCronBuilderProps) => {
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  console.log('⏰ AdvancedCronBuilder - Render:', {
    value,
    hour,
    minute,
    frequency,
    selectedDays,
    generatedCron: `${minute} ${hour} * * ${getdayPattern()}`
  });

  // Função auxiliar para obter o padrão de dias
  function getdayPattern(): string {
    switch (frequency) {
      case 'daily':
        return '*';
      case 'weekdays':
        return '1-5';
      case 'custom':
        return selectedDays.length > 0 ? selectedDays.sort((a, b) => a - b).join(',') : '*';
      default:
        return '*';
    }
  }

  // Parse existing cron expression on mount or when value changes
  useEffect(() => {
    console.log('⏰ Parsing cron expression:', value);
    if (value && value !== '' && value !== '0 9 * * *') {
      parseCronExpression(value);
    }
  }, [value]);

  // Generate cron expression when values change
  useEffect(() => {
    const cronExpression = generateCronExpression();
    console.log('⏰ Generated cron expression:', cronExpression, 'for time:', `${hour}:${minute}`);
    
    // Só chama onChange se realmente mudou
    if (cronExpression !== value) {
      onChange(cronExpression);
    }
  }, [hour, minute, frequency, selectedDays]);

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
        const days = dayPart.split(',').map(d => parseInt(d)).filter(d => !isNaN(d) && d >= 0 && d <= 6);
        setSelectedDays(days);
      } else if (!isNaN(parseInt(dayPart))) {
        const day = parseInt(dayPart);
        if (day >= 0 && day <= 6) {
          setFrequency('custom');
          setSelectedDays([day]);
        }
      }
    }
  };

  const generateCronExpression = (): string => {
    const dayPattern = getdayPattern();
    const cronExpression = `${minute} ${hour} * * ${dayPattern}`;
    console.log('🔄 Generated cron:', cronExpression, 'for time:', `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
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
      let attempts = 0;
      while ((nextRun.getDay() === 0 || nextRun.getDay() === 6) && attempts < 7) {
        nextRun.setDate(nextRun.getDate() + 1);
        attempts++;
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
    console.log('⏰ Hour changed from', hour, 'to', validHour);
    setHour(validHour);
  };

  const handleMinuteChange = (newMinute: string) => {
    const minuteValue = parseInt(newMinute) || 0;
    const validMinute = Math.max(0, Math.min(59, minuteValue));
    console.log('⏰ Minute changed from', minute, 'to', validMinute);
    setMinute(validMinute);
  };

  const handleQuickTime = (quickTime: { hour: number; minute: number }) => {
    console.log('⏰ Quick time selected:', quickTime);
    setHour(quickTime.hour);
    setMinute(quickTime.minute);
  };

  const isValidTime = hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
  const hasValidDays = frequency !== 'custom' || selectedDays.length > 0;

  return (
    <div className="space-y-6">
      {/* Horário */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Clock className="h-5 w-5 text-blue-400" />
            Horário de Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Horário Manual */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label htmlFor="hour" className="text-gray-300">Hora</Label>
                <Input
                  id="hour"
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => handleHourChange(e.target.value)}
                  className="w-20 text-center bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="text-2xl font-bold text-gray-400 mt-6">:</div>
              <div className="space-y-2">
                <Label htmlFor="minute" className="text-gray-300">Minuto</Label>
                <Input
                  id="minute"
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => handleMinuteChange(e.target.value)}
                  className="w-20 text-center bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="ml-4 mt-6">
                <div className="flex items-center gap-2">
                  {isValidTime ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                  <Badge 
                    variant="outline" 
                    className="text-lg px-3 py-1 bg-gray-700 border-gray-600 text-white"
                  >
                    {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Horários Rápidos */}
            <div className="space-y-2">
              <Label className="text-gray-300">Horários Rápidos:</Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TIMES.map((time) => (
                  <button
                    key={time.label}
                    type="button"
                    onClick={() => handleQuickTime(time)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      hour === time.hour && minute === time.minute
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequência */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Calendar className="h-5 w-5 text-green-400" />
            Frequência de Envio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Tipo de Repetição</Label>
            <Select value={frequency} onValueChange={(value: FrequencyType) => {
              console.log('⏰ Frequency changed:', value);
              setFrequency(value);
              // Reset selectedDays based on frequency
              if (value === 'weekdays') {
                setSelectedDays([1, 2, 3, 4, 5]);
              } else if (value === 'daily') {
                setSelectedDays([]);
              }
            }}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="daily" className="text-white hover:bg-gray-600">Diário</SelectItem>
                <SelectItem value="weekdays" className="text-white hover:bg-gray-600">Dias Úteis (Seg-Sex)</SelectItem>
                <SelectItem value="custom" className="text-white hover:bg-gray-600">Dias Específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'custom' && (
            <div className="space-y-3">
              <Label className="text-gray-300">Selecione os dias da semana:</Label>
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
                      className="border-gray-600 data-[state=checked]:bg-blue-600"
                    />
                    <Label
                      htmlFor={`day-${day.id}`}
                      className="text-xs font-medium cursor-pointer text-gray-300"
                    >
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Selecione pelo menos um dia da semana</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-blue-900 border-blue-700">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-200">Resumo do Agendamento:</span>
              <div className="flex items-center gap-2">
                {isValidTime && hasValidDays ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <Badge className="bg-blue-700 text-blue-100 border-blue-600">
                  {getFrequencyDescription()} às {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                </Badge>
              </div>
            </div>
            
            {isValidTime && hasValidDays && (
              <div className="text-sm text-blue-200">
                <strong>Próximo envio:</strong> {getNextExecutionPreview()}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="text-xs text-blue-300 font-mono bg-blue-800 p-2 rounded">
                <strong>Expressão Cron:</strong> {generateCronExpression()}
              </div>
              <div className="text-xs text-blue-300">
                <strong>Validação:</strong> {
                  isValidTime && hasValidDays 
                    ? '✅ Configuração válida' 
                    : '❌ Configuração inválida'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
