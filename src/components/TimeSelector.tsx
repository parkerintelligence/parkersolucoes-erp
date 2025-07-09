
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface TimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCustomCron?: (cron: string) => void;
}

const CRON_PRESETS = [
  { label: '6:00 - Todo dia', value: '0 6 * * *' },
  { label: '9:00 - Todo dia', value: '0 9 * * *' },
  { label: '12:00 - Todo dia', value: '0 12 * * *' },
  { label: '18:00 - Todo dia', value: '0 18 * * *' },
  { label: '8:00 - Segunda a Sexta', value: '0 8 * * 1-5' },
  { label: '9:00 - Segunda a Sexta', value: '0 9 * * 1-5' },
  { label: '6:00 - Toda Segunda', value: '0 6 * * 1' },
  { label: '9:00 - Todo Domingo', value: '0 9 * * 0' },
  { label: 'Personalizado', value: 'custom' },
];

export const TimeSelector = ({ value, onChange, onCustomCron }: TimeSelectorProps) => {
  const [customMode, setCustomMode] = React.useState(false);
  const [hour, setHour] = React.useState('9');
  const [minute, setMinute] = React.useState('0');
  const [frequency, setFrequency] = React.useState('daily');
  const [customCron, setCustomCron] = React.useState('');

  const generateCronFromTime = () => {
    const cronMap: Record<string, string> = {
      'daily': `${minute} ${hour} * * *`,
      'weekdays': `${minute} ${hour} * * 1-5`,
      'weekly': `${minute} ${hour} * * 1`,
      'monthly': `${minute} ${hour} 1 * *`,
    };
    return cronMap[frequency] || `${minute} ${hour} * * *`;
  };

  const handleTimeChange = () => {
    const cron = generateCronFromTime();
    onChange(cron);
  };

  const handlePresetChange = (preset: string) => {
    if (preset === 'custom') {
      setCustomMode(true);
    } else {
      setCustomMode(false);
      onChange(preset);
    }
  };

  const handleCustomCronSubmit = () => {
    if (customCron.trim()) {
      onChange(customCron);
      onCustomCron?.(customCron);
    }
  };

  React.useEffect(() => {
    if (!customMode && hour && minute && frequency) {
      handleTimeChange();
    }
  }, [hour, minute, frequency, customMode]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white">Horário de Execução</Label>
        <Select value={customMode ? 'custom' : value} onValueChange={handlePresetChange}>
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Selecione um horário" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {CRON_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value} className="text-white hover:bg-gray-600">
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {customMode && (
        <div className="space-y-4 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-orange-500" />
            <Label className="text-white font-medium">Configuração Personalizada</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Hora</Label>
              <Select value={hour} onValueChange={setHour}>
                <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-600 border-gray-500">
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-white hover:bg-gray-500">
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Minuto</Label>
              <Select value={minute} onValueChange={setMinute}>
                <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-600 border-gray-500">
                  {[0, 15, 30, 45].map((min) => (
                    <SelectItem key={min} value={min.toString()} className="text-white hover:bg-gray-500">
                      :{min.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="bg-gray-600 border-gray-500 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-600 border-gray-500">
                <SelectItem value="daily" className="text-white hover:bg-gray-500">Todo dia</SelectItem>
                <SelectItem value="weekdays" className="text-white hover:bg-gray-500">Segunda a Sexta</SelectItem>
                <SelectItem value="weekly" className="text-white hover:bg-gray-500">Toda semana</SelectItem>
                <SelectItem value="monthly" className="text-white hover:bg-gray-500">Todo mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Ou insira uma expressão cron personalizada:</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 0 */2 * * *"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
              />
              <Button 
                onClick={handleCustomCronSubmit}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Aplicar
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Formato: minuto hora dia mês dia-da-semana
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
