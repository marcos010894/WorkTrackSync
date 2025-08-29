@echo off
title WorkTrack Monitor - Corrigir Autostart
color 0A

echo.
echo ========================================
echo  WorkTrack Monitor - Corrigir Autostart  
echo ========================================
echo.

set INSTALL_DIR=%USERPROFILE%\.worktrack_monitor
set SCRIPT_PATH=%INSTALL_DIR%\monitor.py

:: Verificar se esta instalado
if not exist "%SCRIPT_PATH%" (
    echo [ERRO] Monitor nao instalado!
    echo [INFO] Execute install.bat primeiro
    pause
    exit /b 1
)

echo [INFO] Corrigindo autostart do WorkTrack Monitor...
echo.

:: Metodo 1: Registro do Windows
echo [INFO] Metodo 1: Configurando registro...

:: Obter caminho completo do Python
for /f "tokens=*" %%i in ('where python 2^>nul') do set PYTHON_PATH=%%i
if "%PYTHON_PATH%"=="" (
    :: Tentar caminhos comuns do Python
    if exist "C:\Python311\python.exe" set PYTHON_PATH=C:\Python311\python.exe
    if exist "C:\Python310\python.exe" set PYTHON_PATH=C:\Python310\python.exe
    if exist "C:\Python39\python.exe" set PYTHON_PATH=C:\Python39\python.exe
    if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set PYTHON_PATH=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
    if exist "%LOCALAPPDATA%\Programs\Python\Python310\python.exe" set PYTHON_PATH=%LOCALAPPDATA%\Programs\Python\Python310\python.exe
)

if "%PYTHON_PATH%"=="" (
    echo [AVISO] Python nao encontrado, usando 'python'
    set PYTHON_PATH=python
)

echo [INFO] Python encontrado em: %PYTHON_PATH%

:: Remover entrada antiga se existir
reg delete "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" /f >nul 2>&1

:: Adicionar nova entrada
set REG_COMMAND="%PYTHON_PATH%" "%SCRIPT_PATH%"
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" /t REG_SZ /d "%REG_COMMAND%" /f >nul 2>&1
if errorlevel 1 (
    echo [FALHA] Metodo 1 falhou
) else (
    echo [OK] Metodo 1 configurado
)

:: Metodo 2: Pasta Startup (alternativo)
echo.
echo [INFO] Metodo 2: Configurando pasta Startup...

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set STARTUP_BAT=%STARTUP_DIR%\WorkTrackMonitor.bat

:: Criar arquivo .bat na pasta startup
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo start /min "%PYTHON_PATH%" monitor.py
) > "%STARTUP_BAT%"

if exist "%STARTUP_BAT%" (
    echo [OK] Metodo 2 configurado
) else (
    echo [FALHA] Metodo 2 falhou
)

:: Metodo 3: Task Scheduler (mais robusto)
echo.
echo [INFO] Metodo 3: Configurando Task Scheduler...

:: Criar tarefa agendada
schtasks /create /tn "WorkTrackMonitor" /tr "\"%PYTHON_PATH%\" \"%SCRIPT_PATH%\"" /sc onlogon /rl limited /f >nul 2>&1
if errorlevel 1 (
    echo [FALHA] Metodo 3 falhou
) else (
    echo [OK] Metodo 3 configurado
)

echo.
echo ========================================
echo           VERIFICACAO FINAL
echo ========================================
echo.

:: Verificar metodos
set METHODS_OK=0

:: Verificar registro
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Metodo 1: Registro configurado
    set /a METHODS_OK+=1
)

:: Verificar startup
if exist "%STARTUP_BAT%" (
    echo [OK] Metodo 2: Startup configurado  
    set /a METHODS_OK+=1
)

:: Verificar task scheduler
schtasks /query /tn "WorkTrackMonitor" >nul 2>&1
if not errorlevel 1 (
    echo [OK] Metodo 3: Task Scheduler configurado
    set /a METHODS_OK+=1
)

echo.
if %METHODS_OK% gtr 0 (
    echo [SUCESSO] %METHODS_OK% metodo(s) de autostart configurado(s)!
    echo [INFO] O monitor deve iniciar automaticamente no proximo boot
    echo.
    echo [TESTE] Para testar agora:
    echo 1. Reinicie o computador
    echo 2. Ou execute: check_autostart.bat
) else (
    echo [ERRO] Nenhum metodo de autostart funcionou!
    echo.
    echo [SOLUCAO MANUAL]:
    echo 1. Win+R, digite: shell:startup
    echo 2. Crie arquivo: WorkTrackMonitor.bat
    echo 3. Conteudo:
    echo    @echo off
    echo    "%PYTHON_PATH%" "%SCRIPT_PATH%"
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
