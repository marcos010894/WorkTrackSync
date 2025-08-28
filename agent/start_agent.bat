@echo off
REM WorkTrack Agent - Script de Inicialização para Windows
REM Este script inicia o agente corretamente e trata erros comuns

echo ========================================
echo   WORKTRACK AGENT - INICIANDO
echo ========================================
echo.

REM Verificar se estamos no diretório correto
if not exist "worktrack_agent.py" (
    echo [ERRO] Arquivo worktrack_agent.py nao encontrado!
    echo Navegue para o diretório correto: agent/
    echo.
    echo Exemplo:
    echo cd C:\Users\User\Documents\worktracksync\WorkTrackSync\agent
    echo.
    pause
    exit /b 1
)

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao esta instalado ou nao esta no PATH!
    echo Instale o Python 3.7+ e tente novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Python encontrado
python --version

REM Verificar dependências
echo.
echo [INFO] Verificando dependencias...
python -c "import requests, psutil" >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Instalando dependencias necessarias...
    pip install requests psutil
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

echo [OK] Dependencias verificadas

REM Verificar configuração
if not exist "config.json" (
    echo [AVISO] Arquivo config.json nao encontrado! Criando configuracao padrao...
    echo {> config.json
    echo     "server_url": "http://localhost:8080/api",>> config.json
    echo     "monitoring_interval": 300,>> config.json
    echo     "heartbeat_interval": 60,>> config.json
    echo     "enable_remote_commands": true,>> config.json
    echo     "auto_start": true,>> config.json
    echo     "log_level": "INFO">> config.json
    echo }>> config.json
    echo [OK] Configuracao padrao criada
)

echo.
echo ========================================
echo   INICIANDO WORKTRACK AGENT
echo ========================================
echo.
echo [INFO] Pressione Ctrl+C para parar o agente
echo [INFO] Os logs serao salvos em: worktrack_agent.log
echo.

REM Executar o agente
python worktrack_agent.py

REM Se chegou aqui, o agente parou
echo.
echo ========================================
echo   WORKTRACK AGENT PARADO
echo ========================================
echo.

REM Verificar se há arquivo de log para mostrar últimas linhas
if exist "worktrack_agent.log" (
    echo [INFO] Ultimas linhas do log:
    echo.
    powershell "Get-Content worktrack_agent.log -Tail 5"
    echo.
)

echo Pressione qualquer tecla para sair...
pause >nul
