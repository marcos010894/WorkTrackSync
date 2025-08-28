-- Otimizações do banco de dados para melhorar performance
-- Execute estas queries no MySQL para otimizar o sistema

-- Índices para tabela activity_logs
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_computer_timestamp ON activity_logs(computer_id, timestamp);

-- Índices para tabela daily_sessions
CREATE INDEX idx_daily_sessions_date ON daily_sessions(session_date);
CREATE INDEX idx_daily_sessions_computer_date ON daily_sessions(computer_id, session_date);

-- Índices para tabela computers
CREATE INDEX idx_computers_online ON computers(is_online);
CREATE INDEX idx_computers_activity ON computers(last_activity);

-- Otimizar estrutura da tabela activity_logs se necessário
-- ALTER TABLE activity_logs ADD INDEX idx_recent_activity (timestamp DESC, computer_id);

-- Configurações do MySQL para melhor performance
-- SET GLOBAL innodb_buffer_pool_size = 128M;  -- Ajustar conforme RAM disponível
-- SET GLOBAL query_cache_size = 32M;
-- SET GLOBAL query_cache_type = ON;

-- Verificar e otimizar tabelas
OPTIMIZE TABLE activity_logs;
OPTIMIZE TABLE daily_sessions;
OPTIMIZE TABLE computers;
OPTIMIZE TABLE application_usage;

-- Limpar logs antigos (manter apenas últimos 30 dias)
DELETE FROM activity_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Query para verificar performance das consultas
-- EXPLAIN SELECT al.activity_type, al.timestamp, c.computer_name FROM activity_logs al JOIN computers c ON al.computer_id = c.computer_id WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY al.timestamp DESC LIMIT 5;
