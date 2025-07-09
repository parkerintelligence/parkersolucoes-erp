
-- Corrigir a função calculate_next_execution para fazer a conversão correta de timezone
CREATE OR REPLACE FUNCTION public.calculate_next_execution(cron_expr text, from_time timestamp with time zone DEFAULT now())
RETURNS timestamp with time zone
LANGUAGE plpgsql
AS $function$
DECLARE
  parts TEXT[];
  target_minute INTEGER;
  target_hour INTEGER;
  target_days TEXT;
  next_exec TIMESTAMP WITH TIME ZONE;
  current_day INTEGER;
  target_day_array INTEGER[];
  brasilia_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Parser básico para expressões cron no formato: "minuto hora * * dias"
  parts := string_to_array(cron_expr, ' ');
  
  IF array_length(parts, 1) < 5 THEN
    -- Fallback: próxima hora se formato inválido
    RETURN date_trunc('hour', from_time) + INTERVAL '1 hour';
  END IF;
  
  target_minute := parts[1]::INTEGER;
  target_hour := parts[2]::INTEGER;
  target_days := parts[5];
  
  -- Validar valores
  IF target_minute < 0 OR target_minute > 59 OR target_hour < 0 OR target_hour > 23 THEN
    RETURN date_trunc('hour', from_time) + INTERVAL '1 hour';
  END IF;
  
  -- Converter o horário atual para timezone de Brasília para fazer os cálculos
  brasilia_time := from_time AT TIME ZONE 'America/Sao_Paulo';
  
  -- Calcular próxima execução para hoje no horário de Brasília
  next_exec := date_trunc('day', brasilia_time) + 
               INTERVAL '1 hour' * target_hour + 
               INTERVAL '1 minute' * target_minute;
  
  -- Se já passou o horário hoje, começar de amanhã
  IF next_exec <= brasilia_time THEN
    next_exec := next_exec + INTERVAL '1 day';
  END IF;
  
  -- Processar dias da semana específicos
  IF target_days != '*' THEN
    -- Para dias úteis (1-5)
    IF target_days = '1-5' THEN
      -- Encontrar o próximo dia útil
      WHILE EXTRACT(DOW FROM next_exec) NOT IN (1,2,3,4,5) LOOP
        next_exec := next_exec + INTERVAL '1 day';
      END LOOP;
    -- Para dias específicos separados por vírgula
    ELSIF target_days ~ '^[0-6](,[0-6])*$' THEN
      target_day_array := string_to_array(target_days, ',')::INTEGER[];
      -- Encontrar o próximo dia válido
      WHILE NOT (EXTRACT(DOW FROM next_exec)::INTEGER = ANY(target_day_array)) LOOP
        next_exec := next_exec + INTERVAL '1 day';
        -- Evitar loop infinito
        IF next_exec > brasilia_time + INTERVAL '7 days' THEN
          EXIT;
        END IF;
      END LOOP;
    -- Para um único dia específico
    ELSIF target_days ~ '^\d$' THEN
      current_day := EXTRACT(DOW FROM next_exec)::INTEGER;
      target_day_array := ARRAY[target_days::INTEGER];
      WHILE NOT (current_day = ANY(target_day_array)) LOOP
        next_exec := next_exec + INTERVAL '1 day';
        current_day := EXTRACT(DOW FROM next_exec)::INTEGER;
        -- Evitar loop infinito
        IF next_exec > brasilia_time + INTERVAL '7 days' THEN
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  -- CORREÇÃO: Converter corretamente de Brasília para UTC
  -- Mudança de timezone('UTC', next_exec) para next_exec AT TIME ZONE 'UTC'
  RETURN next_exec AT TIME ZONE 'UTC';
END;
$function$;

-- Recalcular todas as próximas execuções existentes com a função corrigida
UPDATE scheduled_reports 
SET next_execution = calculate_next_execution(cron_expression, now())
WHERE is_active = true;
