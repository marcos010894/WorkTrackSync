-- WorkTrackSync Database Schema
-- Usando o banco existente

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS administrators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de computadores/dispositivos
CREATE TABLE IF NOT EXISTS computers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    computer_name VARCHAR(100) NOT NULL,
    computer_id VARCHAR(100) NOT NULL UNIQUE,
    user_name VARCHAR(100) NOT NULL,
    os_info VARCHAR(200),
    ip_address VARCHAR(45),
    mac_address VARCHAR(17),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    agent_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_computer_id (computer_id),
    INDEX idx_online_status (is_online),
    INDEX idx_last_activity (last_activity)
);

-- Tabela de sessões de uso diário
CREATE TABLE IF NOT EXISTS daily_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    computer_id VARCHAR(100) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_minutes INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_computer_date (computer_id, session_date),
    INDEX idx_session_date (session_date),
    INDEX idx_computer_session (computer_id, session_date)
);

-- Tabela de programas em execução
CREATE TABLE IF NOT EXISTS running_programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    computer_id VARCHAR(100) NOT NULL,
    program_name VARCHAR(200) NOT NULL,
    program_path VARCHAR(500),
    window_title VARCHAR(300),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    duration_minutes INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_computer_programs (computer_id),
    INDEX idx_program_name (program_name),
    INDEX idx_captured_at (captured_at),
    INDEX idx_active_programs (computer_id, is_active)
);

-- Tabela de comandos remotos
CREATE TABLE IF NOT EXISTS remote_commands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    computer_id VARCHAR(100) NOT NULL,
    command_type ENUM('lock', 'unlock', 'restart', 'shutdown', 'message') NOT NULL,
    command_data TEXT,
    status ENUM('pending', 'sent', 'executed', 'failed') DEFAULT 'pending',
    sent_by INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP NULL,
    response_data TEXT,
    INDEX idx_computer_commands (computer_id),
    INDEX idx_command_status (status),
    INDEX idx_sent_at (sent_at)
);

-- Tabela de logs de atividades
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    computer_id VARCHAR(100) NOT NULL,
    activity_type ENUM('login', 'logout', 'heartbeat', 'program_start', 'program_end', 'command_received') NOT NULL,
    activity_data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_computer_activity (computer_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_timestamp (timestamp)
);

-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir administrador padrão (senha: admin123)
INSERT INTO administrators (username, email, password_hash, full_name) VALUES 
('admin', 'admin@worktrack.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador do Sistema')
ON DUPLICATE KEY UPDATE id=id;

-- Inserir configurações padrão
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('monitoring_interval', '300', 'Intervalo de monitoramento em segundos (5 minutos)'),
('auto_lock_inactive', '3600', 'Tempo para bloqueio automático por inatividade (segundos)'),
('data_retention_days', '90', 'Dias para manter dados de atividade'),
('enable_remote_commands', '1', 'Habilitar comandos remotos'),
('max_daily_hours', '8', 'Máximo de horas diárias esperadas')
ON DUPLICATE KEY UPDATE setting_key=setting_key;
