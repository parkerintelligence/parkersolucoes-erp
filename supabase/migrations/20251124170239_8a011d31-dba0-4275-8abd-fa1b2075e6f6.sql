-- Habilitar RLS na tabela de agendamentos de snapshots
ALTER TABLE hostinger_snapshot_schedules ENABLE ROW LEVEL SECURITY;

-- Política para visualizar próprios agendamentos
CREATE POLICY "Usuários podem ver seus próprios agendamentos de snapshots"
ON hostinger_snapshot_schedules
FOR SELECT
USING (auth.uid() = user_id);

-- Política para criar agendamentos
CREATE POLICY "Usuários podem criar seus próprios agendamentos de snapshots"
ON hostinger_snapshot_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para atualizar próprios agendamentos
CREATE POLICY "Usuários podem atualizar seus próprios agendamentos de snapshots"
ON hostinger_snapshot_schedules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para deletar próprios agendamentos
CREATE POLICY "Usuários podem deletar seus próprios agendamentos de snapshots"
ON hostinger_snapshot_schedules
FOR DELETE
USING (auth.uid() = user_id);