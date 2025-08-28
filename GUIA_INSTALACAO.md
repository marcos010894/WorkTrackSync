# 🖥️ WorkTrackSync - Guia de Instalação Completo

Este guia ensina como instalar o sistema WorkTrackSync em computadores para monitoramento de uso.

## 📋 Visão Geral do Sistema

O WorkTrackSync é composto por:
- **Servidor Web** (PHP) - Dashboard administrativo
- **Agente** (Python) - Monitora o computador cliente
- **Banco de Dados** (MySQL) - Armazena os dados coletados

## 🎯 Opções de Instalação

### 1. Instalação do Servidor (Administrador)
### 2. Instalação do Agente (Computadores Cliente)

---

## 🖥️ 1. INSTALAÇÃO DO SERVIDOR

### Pré-requisitos do Servidor:
- Windows/Linux/macOS
- PHP 8.0+
- MySQL 5.7+
- Conexão com internet

### Opção A: Servidor Local (Windows)

1. **Execute o instalador automático:**
   ```bat
   # Baixe e execute como Administrador:
   install_server.bat
   ```

2. **Ou instalação manual:**
   ```cmd
   # 1. Instalar XAMPP
   https://www.apachefriends.org/download.html
   
   # 2. Copiar arquivos web para htdocs
   # 3. Importar database/schema.sql no MySQL
   # 4. Configurar web/includes/config.php
   ```

### Opção B: Servidor Linux

1. **Execute o script de instalação:**
   ```bash
   chmod +x install_server.sh
   sudo ./install_server.sh
   ```

2. **Ou instalação manual:**
   ```bash
   # Instalar dependências
   sudo apt update
   sudo apt install php mysql-server nginx
   
   # Configurar banco de dados
   mysql -u root -p < database/schema.sql
   
   # Configurar servidor web
   sudo cp -r web/* /var/www/html/
   ```

### Configuração do Banco de Dados:

1. **Criar banco:**
   ```sql
   CREATE DATABASE worktrack_db;
   CREATE USER 'worktrack_user'@'localhost' IDENTIFIED BY 'sua_senha';
   GRANT ALL PRIVILEGES ON worktrack_db.* TO 'worktrack_user'@'localhost';
   ```

2. **Importar estrutura:**
   ```bash
   mysql -u worktrack_user -p worktrack_db < database/schema.sql
   ```

3. **Configurar conexão em `web/includes/config.php`:**
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'worktrack_db');
   define('DB_USER', 'worktrack_user');
   define('DB_PASS', 'sua_senha');
   ```

### Teste do Servidor:
1. Acesse: `http://localhost/login.php`
2. Login: `admin` / Senha: `admin123`
3. Verifique se o dashboard carrega

---

## 💻 2. INSTALAÇÃO DO AGENTE (Computadores Cliente)

### Para Windows (Recomendado):

#### Opção A: Instalador Automático
1. **Baixe um dos instaladores:**
   - `install_worktrack.bat` (completo)
   - `setup_worktrack_simple.bat` (simples)

2. **Execute como Administrador:**
   - Clique direito → "Executar como administrador"
   - Siga as instruções na tela
   - Configure o IP do servidor quando solicitado

#### Opção B: Instalação Manual
1. **Instalar Python:**
   ```cmd
   # Baixar de: https://python.org/downloads/
   # OU usar winget:
   winget install Python.Python.3.11
   ```

2. **Instalar dependências:**
   ```cmd
   pip install requests psutil pywin32 schedule
   ```

3. **Baixar e configurar agente:**
   ```cmd
   # 1. Copiar agent/worktrack_agent.py para C:\WorkTrack\
   # 2. Copiar agent/config.json para C:\WorkTrack\
   # 3. Editar config.json com IP do servidor
   ```

4. **Configurar inicialização automática:**
   ```cmd
   # Adicionar ao startup do Windows:
   reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrack" /d "C:\WorkTrack\start.bat"
   ```

### Para macOS:

1. **Instalar Python e dependências:**
   ```bash
   brew install python
   pip3 install requests psutil schedule
   ```

2. **Configurar agente:**
   ```bash
   mkdir ~/WorkTrack
   cp agent/worktrack_agent.py ~/WorkTrack/
   cp agent/config.json ~/WorkTrack/
   # Editar config.json com IP do servidor
   ```

3. **Criar script de inicialização:**
   ```bash
   cat > ~/WorkTrack/start.sh << 'EOF'
   #!/bin/bash
   cd ~/WorkTrack
   python3 worktrack_agent.py
   EOF
   chmod +x ~/WorkTrack/start.sh
   ```

4. **Configurar inicialização automática:**
   ```bash
   cat > ~/Library/LaunchAgents/com.worktrack.agent.plist << 'EOF'
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.worktrack.agent</string>
       <key>ProgramArguments</key>
       <array>
           <string>/Users/$(whoami)/WorkTrack/start.sh</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
   </dict>
   </plist>
   EOF
   
   launchctl load ~/Library/LaunchAgents/com.worktrack.agent.plist
   ```

### Para Linux:

1. **Instalar dependências:**
   ```bash
   sudo apt install python3 python3-pip
   pip3 install requests psutil schedule
   ```

2. **Configurar agente:**
   ```bash
   sudo mkdir /opt/worktrack
   sudo cp agent/worktrack_agent.py /opt/worktrack/
   sudo cp agent/config.json /opt/worktrack/
   # Editar config.json com IP do servidor
   ```

3. **Criar serviço systemd:**
   ```bash
   sudo cat > /etc/systemd/system/worktrack.service << 'EOF'
   [Unit]
   Description=WorkTrack Monitoring Agent
   After=network.target
   
   [Service]
   Type=simple
   User=nobody
   WorkingDirectory=/opt/worktrack
   ExecStart=/usr/bin/python3 worktrack_agent.py
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   EOF
   
   sudo systemctl enable worktrack
   sudo systemctl start worktrack
   ```

---

## ⚙️ CONFIGURAÇÃO

### Configuração do Agente (`config.json`):

```json
{
    "server_url": "http://IP_DO_SERVIDOR:8080",
    "computer_name": "NOME_DO_COMPUTADOR",
    "heartbeat_interval": 30,
    "data_collection_interval": 60,
    "log_level": "INFO",
    "auto_start": true,
    "hide_window": true
}
```

### Configuração do Servidor:

1. **Editar `web/includes/config.php`:**
   ```php
   // Configurações do banco
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'worktrack_db');
   define('DB_USER', 'worktrack_user');
   define('DB_PASS', 'senha_segura');
   
   // URL do servidor
   define('SERVER_URL', 'http://IP_DO_SERVIDOR');
   ```

2. **Configurar permissões (Linux):**
   ```bash
   sudo chown -R www-data:www-data /var/www/html/
   sudo chmod -R 755 /var/www/html/
   ```

---

## 🧪 TESTE E VERIFICAÇÃO

### Testar Servidor:
```bash
# Verificar se servidor está rodando:
curl http://localhost/api/ping.php

# Resposta esperada:
{"status":"ok","message":"WorkTrack API Online","timestamp":"2025-01-28 10:30:00"}
```

### Testar Agente:
```bash
# Windows:
python "C:\WorkTrack\worktrack_agent.py"

# macOS/Linux:
python3 ~/WorkTrack/worktrack_agent.py
```

### Verificar no Dashboard:
1. Acesse: `http://IP_DO_SERVIDOR/dashboard.php`
2. Vá em "Computadores"
3. Verifique se o computador aparece como "Online"

---

## 🔧 SOLUÇÃO DE PROBLEMAS

### Agente não conecta:
```bash
# Testar conectividade:
ping IP_DO_SERVIDOR
curl http://IP_DO_SERVIDOR/api/ping.php

# Verificar config.json
# Verificar firewall/antivírus
```

### Servidor não carrega:
```bash
# Verificar PHP:
php --version

# Verificar MySQL:
mysql -u root -p -e "SHOW DATABASES;"

# Verificar logs:
tail -f /var/log/apache2/error.log  # Linux
```

### Agente não inicia automaticamente:
```bash
# Windows - verificar registro:
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run"

# Linux - verificar serviço:
sudo systemctl status worktrack

# macOS - verificar LaunchAgent:
launchctl list | grep worktrack
```

---

## 📱 INSTALAÇÃO RÁPIDA (Resumo)

### 1. Servidor (1 vez):
```bash
# Windows: Executar install_server.bat como admin
# Linux: sudo ./install_server.sh
# Configurar IP e credenciais do banco
```

### 2. Cada Computador Cliente:
```bash
# Windows: Executar install_worktrack.bat como admin
# Informar IP do servidor quando solicitado
# Agente ficará invisível e iniciará automaticamente
```

### 3. Verificar:
- Acessar dashboard web
- Verificar computadores online
- Testar relatórios

---

## 📞 SUPORTE

### Logs importantes:
- **Servidor:** `/var/log/apache2/error.log` (Linux)
- **Agente:** `%APPDATA%\WorkTrack\worktrack.log` (Windows)
- **Agente:** `~/WorkTrack/worktrack.log` (macOS/Linux)

### Comandos úteis:
```bash
# Parar agente:
# Windows: Gerenciador de Tarefas → python.exe
# Linux/macOS: sudo systemctl stop worktrack

# Reiniciar agente:
# Windows: Reiniciar computador ou executar start.bat
# Linux: sudo systemctl restart worktrack
# macOS: launchctl unload/load ~/Library/LaunchAgents/com.worktrack.agent.plist
```

### Portas utilizadas:
- **Servidor Web:** 80/443 (HTTP/HTTPS)
- **MySQL:** 3306
- **API:** 8080 (configurável)

O sistema está pronto para uso após estas configurações! 🚀
