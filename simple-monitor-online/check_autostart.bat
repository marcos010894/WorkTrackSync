@echo off
title WorkTrack Monitor - Verificar Autostart
color 0E

echo.
echo ========================================
echo   WorkTrack Monitor - Verificar Autostart
echo ========================================
echo.

set INSTALL_DIR=%USERPROFILE%\.worktrack_monitor
set SCRIPT_PATH=%INSTALL_DIR%\monitor.py

:: Verificar se esta instalado
if not exist "%INSTALL_DIR%" (
    echo [ERRO] Monitor nao encontrado!
    echo [INFO] Execute install.bat primeiro
    pause
    exit /b 1
)

if not exist "%SCRIPT_PATH%" (
    echo [ERRO] Script monitor.py nao encontrado!
    echo [INFO] Reinstale o monitor
    pause
    exit /b 1
)

echo [OK] Monitor instalado em: %INSTALL_DIR%
echo.

:: Verificar entrada no registro
echo [INFO] Verificando autostart no registro...
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" >nul 2>&1
if errorlevel 1 (
    echo [PROBLEMA] Entrada de autostart NAO encontrada!
    echo.
    echo [INFO] Tentando corrigir autostart...
    
    :: Obter caminho do Python
    for /f "tokens=*" %%i in ('where python') do set PYTHON_PATH=%%i
    if "%PYTHON_PATH%"=="" (
        echo [AVISO] Python nao encontrado no PATH
        set PYTHON_PATH=python
    )
    
    set REG_COMMAND="%PYTHON_PATH%" "%SCRIPT_PATH%"
    
    :: Tentar adicionar ao registro
    reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" /t REG_SZ /d "%REG_COMMAND%" /f >nul 2>&1
    if errorlevel 1 (
        echo [ERRO] Falha ao adicionar autostart
        echo.
        echo [SOLUCAO MANUAL]:
        echo 1. Pressione Win+R
        echo 2. Digite: shell:startup
        echo 3. Pressione Enter
        echo 4. Crie um arquivo .bat com o conteudo:
        echo    @echo off
        echo    "%PYTHON_PATH%" "%SCRIPT_PATH%"
        echo.
        pause
        exit /b 1
    ) else (
        echo [OK] Autostart corrigido!
    )
) else (
    echo [OK] Entrada de autostart encontrada!
    
    :: Mostrar entrada atual
    for /f "tokens=3*" %%a in ('reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" 2^>nul ^| findstr WorkTrackMonitor') do (
        echo [INFO] Comando atual: %%b
    )
)

echo.

:: Verificar se o processo esta rodando
echo [INFO] Verificando se o monitor esta rodando...
tasklist /fi "imagename eq python.exe" | find "python.exe" >nul
if errorlevel 1 (
    echo [PROBLEMA] Monitor NAO esta rodando!
    echo.
    echo [INFO] Tentando iniciar monitor...
    start /min python "%SCRIPT_PATH%"
    timeout /t 3 >nul
    
    :: Verificar novamente
    tasklist /fi "imagename eq python.exe" | find "python.exe" >nul
    if errorlevel 1 (
        echo [ERRO] Falha ao iniciar monitor
        echo [INFO] Tente executar manualmente:
        echo python "%SCRIPT_PATH%"
    ) else (
        echo [OK] Monitor iniciado com sucesso!
    )
) else (
    echo [OK] Monitor esta rodando!
)

echo.

:: Verificar logs
echo [INFO] Verificando logs...
if exist "%INSTALL_DIR%\monitor.log" (
    echo [OK] Arquivo de log encontrado
    echo [INFO] Ultimas 5 linhas do log:
    echo.
    powershell -Command "Get-Content '%INSTALL_DIR%\monitor.log' | Select-Object -Last 5"
) else (
    echo [AVISO] Arquivo de log nao encontrado
)

echo.

:: Teste de conectividade
echo [INFO] Testando conectividade com servidor...
ping -n 1 google.com >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Sem conexao com internet
) else (
    echo [OK] Conexao com internet OK
)

echo.
echo ========================================
echo           DIAGNOSTICO COMPLETO
echo ========================================
echo.

:: Resumo final
set STATUS_OK=1

if not exist "%SCRIPT_PATH%" set STATUS_OK=0
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" >nul 2>&1
if errorlevel 1 set STATUS_OK=0

if %STATUS_OK% equ 1 (
    echo [OK] Tudo configurado corretamente!
    echo [OK] O monitor deve iniciar automaticamente
    echo [OK] Para testar: reinicie o computador
) else (
    echo [PROBLEMA] Configuracao incompleta
    echo [SOLUCAO] Execute install.bat novamente
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
