@echo off
:: WorkTrack - Instalador Simples
:: Execute como Administrador

echo ========================================
echo       WorkTrack Agent - Setup
echo ========================================

:: Verificar privilégios de admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERRO: Execute como Administrador!
    echo Clique com botao direito e "Executar como administrador"
    pause
    exit /b 1
)

:: Definir caminhos
set "INSTALL_PATH=%ProgramFiles%\WorkTrack"
set "CONFIG_PATH=%APPDATA%\WorkTrack"

:: Criar diretórios
mkdir "%INSTALL_PATH%" 2>nul
mkdir "%CONFIG_PATH%" 2>nul

:: Verificar Python
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Instalando Python...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    echo Python instalado!
)

:: Instalar bibliotecas
echo Instalando dependencias...
pip install requests psutil pywin32 schedule

:: Criar configuração
echo Criando configuracao...
echo {> "%CONFIG_PATH%\config.json"
echo   "server_url": "http://localhost:8080",>> "%CONFIG_PATH%\config.json"
echo   "computer_name": "%COMPUTERNAME%",>> "%CONFIG_PATH%\config.json"
echo   "heartbeat_interval": 30,>> "%CONFIG_PATH%\config.json"
echo   "data_collection_interval": 60>> "%CONFIG_PATH%\config.json"
echo }>> "%CONFIG_PATH%\config.json"

:: Criar agente Python (versão simplificada)
echo Criando agente...
(
echo import json, time, requests, psutil, os, socket
echo from datetime import datetime
echo import win32gui, win32process
echo.
echo config_file = os.path.join^(os.environ['APPDATA'], 'WorkTrack', 'config.json'^)
echo with open^(config_file^) as f: config = json.load^(f^)
echo.
echo computer_id = f"{config['computer_name']}_{hex^(psutil.boot_time^(^)^)[2:]}"
echo server_url = config['server_url']
echo.
echo def get_active_app^(^):
echo     try:
echo         hwnd = win32gui.GetForegroundWindow^(^)
echo         _, pid = win32process.GetWindowThreadProcessId^(hwnd^)
echo         return psutil.Process^(pid^).name^(^)
echo     except: return "Unknown"
echo.
echo def send_data^(^):
echo     try:
echo         app = get_active_app^(^)
echo         data = {
echo             'computer_id': computer_id,
echo             'application_name': app,
echo             'timestamp': datetime.now^(^).isoformat^(^),
echo             'usage_minutes': 1
echo         }
echo         requests.post^(f"{server_url}/api/heartbeat.php", json=data, timeout=5^)
echo     except: pass
echo.
echo print^("WorkTrack Agent iniciado"^)
echo while True:
echo     send_data^(^)
echo     time.sleep^(60^)
) > "%INSTALL_PATH%\agent.py"

:: Criar inicializador
echo @echo off> "%INSTALL_PATH%\start.bat"
echo cd /d "%INSTALL_PATH%">> "%INSTALL_PATH%\start.bat"
echo python agent.py>> "%INSTALL_PATH%\start.bat"

:: Adicionar ao startup do Windows
echo Configurando inicio automatico...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrack" /d "\"%INSTALL_PATH%\start.bat\"" /f

:: Configurar servidor
set /p "SERVER=Digite o IP/URL do servidor (Enter = localhost:8080): "
if not "%SERVER%"=="" (
    powershell -Command "(gc '%CONFIG_PATH%\config.json') -replace 'localhost:8080', '%SERVER%' | sc '%CONFIG_PATH%\config.json'"
)

echo.
echo ========================================
echo     INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Agente instalado em: %INSTALL_PATH%
echo Config em: %CONFIG_PATH%
echo.
echo O WorkTrack iniciara automaticamente no proximo boot.
echo.
set /p "START=Iniciar agora? (S/N): "
if /i "%START%"=="S" start "" "%INSTALL_PATH%\start.bat"

echo.
echo Para desinstalar, delete:
echo - %INSTALL_PATH%
echo - %CONFIG_PATH%
echo - Entrada no Registro: HKCU\Software\Microsoft\Windows\CurrentVersion\Run\WorkTrack
echo.
pause
