-- Esquema do banco de dados para WorkTrackSync
-- Sistema de monitoramento com persistência MySQL

-- Usar banco existente (não criar novo)
USE u441041902_interact_workt;

-- Tabela de dispositivos registrados
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    os_info TEXT,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    total_sessions INT DEFAULT 1,
    is_online BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de atividades/sessões
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    activity_description TEXT,
    active_window VARCHAR(500),
    total_minutes INT DEFAULT 0,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_date (device_id, created_at),
    INDEX idx_session_start (session_start)
);

-- Tabela de histórico diário
CREATE TABLE IF NOT EXISTS daily_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    total_activities INT DEFAULT 0,
    total_minutes INT DEFAULT 0,
    first_activity TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    activities_summary JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device_date (date, device_id),
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_date (date),
    INDEX idx_device_history (device_id, date)
);

-- Tabela de comandos enviados
CREATE TABLE IF NOT EXISTS commands_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    command_type ENUM('lock', 'restart', 'shutdown') NOT NULL,
    status ENUM('sent', 'delivered', 'executed', 'failed') DEFAULT 'sent',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_commands (device_id, sent_at),
    INDEX idx_status (status)
);

-- Tabela de estatísticas do sistema
CREATE TABLE IF NOT EXISTS system_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_devices INT DEFAULT 0,
    online_devices INT DEFAULT 0,
    offline_devices INT DEFAULT 0,
    total_activities INT DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,
    peak_online_devices INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stats_date (date)
);

-- Views para consultas otimizadas
CREATE OR REPLACE VIEW device_summary AS
SELECT 
    d.id,
    d.name,
    d.user_name,
    d.os_info,
    d.first_seen,
    d.last_seen,
    d.total_sessions,
    d.is_online,
    COALESCE(SUM(dh.total_minutes), 0) as total_minutes_all_time,
    COALESCE(SUM(dh.total_activities), 0) as total_activities_all_time,
    (SELECT COUNT(*) FROM activities a WHERE a.device_id = d.id AND DATE(a.created_at) = CURDATE()) as today_activities
FROM devices d
LEFT JOIN daily_history dh ON d.id = dh.device_id
GROUP BY d.id, d.name, d.user_name, d.os_info, d.first_seen, d.last_seen, d.total_sessions, d.is_online;
