-- Corrigir o report_type do agendamento existente para usar o ID do template
UPDATE scheduled_reports 
SET report_type = 'fdce6a50-7beb-4498-8925-608b77d756a1'
WHERE id = 'bf1005ec-7c62-4b43-bb7f-b663f81d2cbb';