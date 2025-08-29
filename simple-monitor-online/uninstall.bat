@echo off
title WorkTrack Monitor - Desinstalador Windows
color 0C

echo.
echo ========================================
echo WorkTrack Monitor - Desinstalador Windows
echo ========================================
echo.

:: Verificar se esta instalado
set INSTALL_DIR=%USERPROFILE%\.worktrack_monitor
if not exist "%INSTALL_DIR%" (
    echo [INFO] Monitor nao parece estar instalado.
    echo.
    pause
    exit /b 0
)

echo [INFO] Monitor encontrado em: %INSTALL_DIR%
echo.

:: Avisar usuario
echo ATENCAO: Isso ira remover completamente o WorkTrack Monitor!
echo.
echo - Parar todos os processos
echo - Remover autostart 
echo - Deletar todos os arquivos
echo.
set /p confirm="Continuar? (S/N): "
if /i "%confirm%" neq "S" (
    echo.
    echo [INFO] Desinstalacao cancelada.
    pause
    exit /b 0
)

echo.
echo [INFO] Iniciando desinstalacao...

:: Tentar matar processos Python relacionados
echo [INFO] Parando processos do monitor...
taskkill /f /fi "WINDOWTITLE eq WorkTrack*" >nul 2>&1
taskkill /f /fi "IMAGENAME eq python.exe" >nul 2>&1
echo [OK] Processos finalizados

:: Remover do registro
echo [INFO] Removendo autostart...
reg delete "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" /f >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Entrada do registro nao encontrada
) else (
    echo [OK] Autostart removido
)

:: Aguardar um pouco
timeout /t 2 >nul

:: Remover diretorio
echo [INFO] Removendo arquivos...
if exist "%INSTALL_DIR%" (
    :: Remover atributo oculto primeiro
    attrib -h "%INSTALL_DIR%" >nul 2>&1
    
    :: Deletar arquivos
    del /f /q "%INSTALL_DIR%\*.*" >nul 2>&1
    rmdir /s /q "%INSTALL_DIR%" >nul 2>&1
    
    if exist "%INSTALL_DIR%" (
        echo [AVISO] Alguns arquivos podem nao ter sido removidos
        echo [INFO] Diretorio: %INSTALL_DIR%
    ) else (
        echo [OK] Arquivos removidos
    )
) else (
    echo [OK] Diretorio ja nao existe
)

:: Verificacao final
echo.
echo [INFO] Verificando se foi removido completamente...

set REMOVED=1
if exist "%INSTALL_DIR%" set REMOVED=0

reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" >nul 2>&1
if not errorlevel 1 set REMOVED=0

if %REMOVED% equ 1 (
    echo.
    echo ========================================
    echo      DESINSTALACAO CONCLUIDA!
    echo ========================================
    echo.
    echo [OK] WorkTrack Monitor removido completamente
    echo [OK] Nao ha mais processos ativos
    echo [OK] Autostart desabilitado 
    echo [OK] Todos os arquivos deletados
    echo.
) else (
    echo.
    echo ========================================
    echo    DESINSTALACAO PARCIALMENTE CONCLUIDA
    echo ========================================
    echo.
    echo [AVISO] Alguns componentes podem nao ter sido removidos
    echo.
    echo Remocao manual:
    echo 1. Verificar processos: Ctrl+Shift+Esc
    echo 2. Verificar pasta: %INSTALL_DIR%
    echo 3. Verificar registro: regedit.exe
    echo    HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
