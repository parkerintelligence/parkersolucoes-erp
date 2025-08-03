-- Fix security issues by updating functions with proper search_path

-- Update get_schedule_type_name function
CREATE OR REPLACE FUNCTION public.get_schedule_type_name(schedule_type_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  IF schedule_type_id_param IS NULL THEN
    RETURN 'Geral';
  END IF;
  
  RETURN COALESCE(
    (SELECT name FROM public.schedule_types WHERE id = schedule_type_id_param LIMIT 1),
    'Geral'
  );
END;
$function$;

-- Update update_schedule_item_type function
CREATE OR REPLACE FUNCTION public.update_schedule_item_type()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Preencher o campo type baseado no schedule_type_id
  NEW.type = public.get_schedule_type_name(NEW.schedule_type_id);
  RETURN NEW;
END;
$function$;

-- Update update_next_execution function
CREATE OR REPLACE FUNCTION public.update_next_execution()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  NEW.next_execution := public.calculate_next_execution(NEW.cron_expression);
  RETURN NEW;
END;
$function$;

-- Update calculate_next_execution function
CREATE OR REPLACE FUNCTION public.calculate_next_execution(cron_expr text, from_time timestamp with time zone DEFAULT now())
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
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
  
  -- Trabalhar diretamente com timestamp sem timezone para evitar conversões desnecessárias
  brasilia_now := (from_time AT TIME ZONE 'America/Sao_Paulo')::timestamp;
  
  -- Calcular próxima execução para hoje
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
  
  -- Converter o resultado de volta para timestamp with timezone no timezone de Brasília
  -- e depois para UTC para armazenamento
  RETURN (brasilia_next AT TIME ZONE 'America/Sao_Paulo');
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$function$;

-- Update is_master function
CREATE OR REPLACE FUNCTION public.is_master(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = user_id AND role = 'master'
  );
END;
$function$;

-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$function$;

-- Update is_master_user function
CREATE OR REPLACE FUNCTION public.is_master_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE 
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT public.get_user_role() = 'master';
$function$;