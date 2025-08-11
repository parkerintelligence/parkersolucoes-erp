-- Reset the next_execution for Bacula report to trigger immediately for testing
UPDATE scheduled_reports 
SET next_execution = now() - interval '1 minute' 
WHERE name = 'Relatório Diário de Erros Bacula';

-- Improve the calculate_next_execution function to handle timezone better
CREATE OR REPLACE FUNCTION public.calculate_next_execution(cron_expr text, from_time timestamp with time zone DEFAULT now())
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  parts TEXT[];
  target_minute INTEGER;
  target_hour INTEGER;
  target_days TEXT;
  next_exec TIMESTAMP WITH TIME ZONE;
  current_day INTEGER;
  target_day_array INTEGER[];
  brasilia_now TIMESTAMP;
  brasilia_next TIMESTAMP;
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
  
  -- Trabalhar com horário de Brasília para calcular a próxima execução
  brasilia_now := (from_time AT TIME ZONE 'America/Sao_Paulo')::timestamp;
  
  -- Calcular próxima execução para hoje no horário de Brasília
  brasilia_next := date_trunc('day', brasilia_now) + 
                   INTERVAL '1 hour' * target_hour + 
                   INTERVAL '1 minute' * target_minute;
  
  -- Se já passou o horário hoje, agendar para amanhã
  IF brasilia_next <= brasilia_now THEN
    brasilia_next := brasilia_next + INTERVAL '1 day';
  END IF;
  
  -- Processar dias da semana específicos
  IF target_days != '*' THEN
    -- Para dias úteis (1-5)
    IF target_days = '1-5' THEN
      -- Encontrar o próximo dia útil
      WHILE EXTRACT(DOW FROM brasilia_next) NOT IN (1,2,3,4,5) LOOP
        brasilia_next := brasilia_next + INTERVAL '1 day';
      END LOOP;
    -- Para dias específicos separados por vírgula
    ELSIF target_days ~ '^[0-6](,[0-6])*$' THEN
      target_day_array := string_to_array(target_days, ',')::INTEGER[];
      -- Encontrar o próximo dia válido
      WHILE NOT (EXTRACT(DOW FROM brasilia_next)::INTEGER = ANY(target_day_array)) LOOP
        brasilia_next := brasilia_next + INTERVAL '1 day';
        -- Evitar loop infinito
        IF brasilia_next > brasilia_now + INTERVAL '7 days' THEN
          EXIT;
        END IF;
      END LOOP;
    -- Para um único dia específico
    ELSIF target_days ~ '^\d$' THEN
      current_day := EXTRACT(DOW FROM brasilia_next)::INTEGER;
      target_day_array := ARRAY[target_days::INTEGER];
      WHILE NOT (current_day = ANY(target_day_array)) LOOP
        brasilia_next := brasilia_next + INTERVAL '1 day';
        current_day := EXTRACT(DOW FROM brasilia_next)::INTEGER;
        -- Evitar loop infinito
        IF brasilia_next > brasilia_now + INTERVAL '7 days' THEN
          EXIT;
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  -- Converter o resultado de volta para timestamp with timezone UTC
  -- Garantir que o resultado seja armazenado corretamente em UTC
  RETURN (brasilia_next AT TIME ZONE 'America/Sao_Paulo');
END;
$function$;