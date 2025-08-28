@echo off
:: WorkTrack Agent - Instalador e Configurador Automático
:: Este script instala o WorkTrack Agent para monitoramento de computador
setlocal enabledelayedexpansion

:: Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando privilegios de administrador...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

cls
echo ========================================
echo     WorkTrack Agent - Instalador
echo ========================================
echo.

:: Definir diretórios
set "INSTALL_DIR=%ProgramFiles%\WorkTrack"
set "DATA_DIR=%APPDATA%\WorkTrack"
set "TEMP_DIR=%TEMP%\WorkTrackInstall"

:: Criar diretórios necessários
echo [1/7] Criando diretorios de instalacao...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" >nul 2>&1
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%" >nul 2>&1
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%" >nul 2>&1

:: Verificar se Python está instalado
echo [2/7] Verificando Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Python nao encontrado. Baixando e instalando Python...
    
    :: Baixar Python
    powershell -Command "Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe' -OutFile '%TEMP_DIR%\python-installer.exe'"
    
    :: Instalar Python silenciosamente
    echo Instalando Python...
    "%TEMP_DIR%\python-installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    
    :: Aguardar instalação
    timeout /t 30 /nobreak >nul
    
    :: Verificar novamente
    python --version >nul 2>&1
    if %errorLevel% neq 0 (
        echo ERRO: Falha na instalacao do Python.
        pause
        exit /b 1
    )
)
echo Python encontrado!

:: Instalar dependências Python
echo [3/7] Instalando dependencias Python...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install requests psutil pywin32 schedule >nul 2>&1

:: Criar arquivo de configuração
echo [4/7] Criando arquivo de configuracao...
(
echo {
echo     "server_url": "http://localhost:8080",
echo     "computer_name": "%COMPUTERNAME%",
echo     "heartbeat_interval": 30,
echo     "data_collection_interval": 60,
echo     "log_level": "INFO",
echo     "auto_start": true,
echo     "hide_window": true
echo }
) > "%DATA_DIR%\config.json"

:: Criar script Python do agente
echo [5/7] Criando agente WorkTrack...
(
echo import os
echo import sys
echo import json
echo import time
echo import requests
echo import psutil
echo import socket
echo import threading
echo import schedule
echo from datetime import datetime
echo import win32gui
echo import win32process
echo import win32con
echo import win32api
echo import logging
echo.
echo class WorkTrackAgent:
echo     def __init__^(self^):
echo         self.config_file = os.path.join^(os.environ['APPDATA'], 'WorkTrack', 'config.json'^)
echo         self.load_config^(^)
echo         self.setup_logging^(^)
echo         self.computer_id = self.get_computer_id^(^)
echo         self.session_start = datetime.now^(^)
echo         self.running = True
echo         
echo     def load_config^(self^):
echo         try:
echo             with open^(self.config_file, 'r'^) as f:
echo                 self.config = json.load^(f^)
echo         except:
echo             self.config = {
echo                 "server_url": "http://localhost:8080",
echo                 "computer_name": socket.gethostname^(^),
echo                 "heartbeat_interval": 30,
echo                 "data_collection_interval": 60,
echo                 "log_level": "INFO"
echo             }
echo             
echo     def setup_logging^(self^):
echo         log_dir = os.path.join^(os.environ['APPDATA'], 'WorkTrack'^)
echo         os.makedirs^(log_dir, exist_ok=True^)
echo         
echo         logging.basicConfig^(
echo             level=getattr^(logging, self.config.get^('log_level', 'INFO'^)^),
echo             format='%%(asctime^)s - %%(levelname^)s - %%(message^)s',
echo             handlers=[
echo                 logging.FileHandler^(os.path.join^(log_dir, 'worktrack.log'^)^),
echo                 logging.StreamHandler^(^)
echo             ]
echo         ^)
echo         self.logger = logging.getLogger^(__name__^)
echo         
echo     def get_computer_id^(self^):
echo         try:
echo             import uuid
echo             mac = hex^(uuid.getnode^(^)^)[2:].upper^(^)
echo             return f"{self.config['computer_name']}_{mac}"
echo         except:
echo             return f"{self.config['computer_name']}_{int^(time.time^(^)^)}"
echo             
echo     def get_active_window^(self^):
echo         try:
echo             hwnd = win32gui.GetForegroundWindow^(^)
echo             if hwnd:
echo                 window_title = win32gui.GetWindowText^(hwnd^)
echo                 _, pid = win32process.GetWindowThreadProcessId^(hwnd^)
echo                 process = psutil.Process^(pid^)
echo                 return {
echo                     'application': process.name^(^),
echo                     'window_title': window_title,
echo                     'pid': pid
echo                 }
echo         except:
echo             pass
echo         return None
echo         
echo     def send_heartbeat^(self^):
echo         try:
echo             now = datetime.now^(^)
echo             usage_minutes = int^(^(now - self.session_start^).total_seconds^(^) // 60^)
echo             
echo             data = {
echo                 'computer_id': self.computer_id,
echo                 'usage_minutes': usage_minutes,
echo                 'timestamp': now.strftime^('%Y-%%m-%%d %%H:%%M:%%S'^),
echo                 'status': 'online'
echo             }
echo             
echo             response = requests.post^(
echo                 f"{self.config['server_url']}/api/heartbeat.php",
echo                 json=data,
echo                 timeout=10
echo             ^)
echo             
echo             if response.status_code == 200:
echo                 self.logger.info^("Heartbeat enviado com sucesso"^)
echo             else:
echo                 self.logger.warning^(f"Heartbeat falhou: {response.status_code}"^)
echo                 
echo         except Exception as e:
echo             self.logger.error^(f"Erro no heartbeat: {e}"^)
echo             
echo     def collect_data^(self^):
echo         try:
echo             active_window = self.get_active_window^(^)
echo             if not active_window:
echo                 return
echo                 
echo             data = {
echo                 'computer_id': self.computer_id,
echo                 'application_name': active_window['application'],
echo                 'window_title': active_window['window_title'],
echo                 'timestamp': datetime.now^(^).strftime^('%Y-%%m-%%d %%H:%%M:%%S'^),
echo                 'duration_minutes': 1
echo             }
echo             
echo             response = requests.post^(
echo                 f"{self.config['server_url']}/api/collect.php",
echo                 json=data,
echo                 timeout=10
echo             ^)
echo             
echo             if response.status_code == 200:
echo                 self.logger.debug^("Dados coletados com sucesso"^)
echo             else:
echo                 self.logger.warning^(f"Coleta de dados falhou: {response.status_code}"^)
echo                 
echo         except Exception as e:
echo             self.logger.error^(f"Erro na coleta: {e}"^)
echo             
echo     def hide_console^(self^):
echo         try:
echo             console_window = win32gui.GetConsoleWindow^(^)
echo             if console_window:
echo                 win32gui.ShowWindow^(console_window, win32con.SW_HIDE^)
echo         except:
echo             pass
echo             
echo     def run^(self^):
echo         if self.config.get^('hide_window', True^):
echo             self.hide_console^(^)
echo             
echo         self.logger.info^("WorkTrack Agent iniciado"^)
echo         
echo         # Agendar tarefas
echo         schedule.every^(self.config['heartbeat_interval']^).seconds.do^(self.send_heartbeat^)
echo         schedule.every^(self.config['data_collection_interval']^).seconds.do^(self.collect_data^)
echo         
echo         while self.running:
echo             try:
echo                 schedule.run_pending^(^)
echo                 time.sleep^(1^)
echo             except KeyboardInterrupt:
echo                 self.logger.info^("Parando agente..."^)
echo                 self.running = False
echo             except Exception as e:
echo                 self.logger.error^(f"Erro no loop principal: {e}"^)
echo                 time.sleep^(5^)
echo                 
echo if __name__ == "__main__":
echo     agent = WorkTrackAgent^(^)
echo     agent.run^(^)
) > "%INSTALL_DIR%\worktrack_agent.py"

:: Criar serviço Windows
echo [6/7] Configurando servico do Windows...

:: Criar script de inicialização
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo python worktrack_agent.py
) > "%INSTALL_DIR%\start_agent.bat"

:: Criar tarefa agendada para iniciar com o Windows
echo [7/7] Configurando inicializacao automatica...
schtasks /delete /tn "WorkTrack Agent" /f >nul 2>&1

schtasks /create /tn "WorkTrack Agent" /tr "\"%INSTALL_DIR%\start_agent.bat\"" /sc onstart /ru SYSTEM /f >nul 2>&1

if %errorLevel% equ 0 (
    echo Tarefa agendada criada com sucesso!
) else (
    echo Erro ao criar tarefa agendada. Tentando metodo alternativo...
    
    :: Método alternativo - Registro do Windows
    reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrack Agent" /t REG_SZ /d "\"%INSTALL_DIR%\start_agent.bat\"" /f >nul 2>&1
)

:: Configurar URL do servidor (opcional)
echo.
echo ========================================
set /p "SERVER_URL=Digite a URL do servidor (ou pressione Enter para usar localhost:8080): "
if not "!SERVER_URL!"=="" (
    echo Atualizando configuracao do servidor...
    powershell -Command "(Get-Content '%DATA_DIR%\config.json') -replace 'http://localhost:8080', '!SERVER_URL!' | Set-Content '%DATA_DIR%\config.json'"
)

:: Limpeza
echo.
echo Limpando arquivos temporarios...
rmdir /s /q "%TEMP_DIR%" >nul 2>&1

:: Iniciar o agente
echo.
echo ========================================
echo   Instalacao concluida com sucesso!
echo ========================================
echo.
echo O WorkTrack Agent foi instalado em: %INSTALL_DIR%
echo Arquivos de configuracao em: %DATA_DIR%
echo.
echo O agente iniciara automaticamente:
echo - Na proxima reinicializacao do Windows
echo - Ou agora mesmo (se escolher)
echo.
set /p "START_NOW=Deseja iniciar o agente agora? (S/N): "
if /i "!START_NOW!"=="S" (
    echo Iniciando WorkTrack Agent...
    start "" "%INSTALL_DIR%\start_agent.bat"
    echo.
    echo Agente iniciado! Ele rodara em segundo plano.
)

echo.
echo Para verificar os logs: %DATA_DIR%\worktrack.log
echo Para parar o agente: Gerenciador de Tarefas
echo Para desinstalar: Execute este script como admin e escolha desinstalar
echo.
echo Pressione qualquer tecla para finalizar...
pause >nul

:: Verificar se é desinstalação
if "%1"=="uninstall" goto :uninstall
exit /b 0

:uninstall
echo ========================================
echo      WorkTrack Agent - Desinstalar
echo ========================================
echo.
echo Removendo servicos...
schtasks /delete /tn "WorkTrack Agent" /f >nul 2>&1
reg delete "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrack Agent" /f >nul 2>&1

echo Parando processos...
taskkill /f /im python.exe /fi "WINDOWTITLE eq WorkTrack*" >nul 2>&1

echo Removendo arquivos...
rmdir /s /q "%INSTALL_DIR%" >nul 2>&1
rmdir /s /q "%DATA_DIR%" >nul 2>&1

echo.
echo WorkTrack Agent removido com sucesso!
pause
exit /b 0
