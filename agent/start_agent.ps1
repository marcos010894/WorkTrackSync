# WorkTrack Agent - Script PowerShell de Inicialização
# Execute com: powershell -ExecutionPolicy Bypass .\start_agent.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   WORKTRACK AGENT - INICIANDO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "worktrack_agent.py")) {
    Write-Host "[ERRO] Arquivo worktrack_agent.py não encontrado!" -ForegroundColor Red
    Write-Host "Navegue para o diretório correto: agent/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplo:" -ForegroundColor Yellow
    Write-Host "cd C:\Users\User\Documents\worktracksync\WorkTrackSync\agent" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Python não está instalado ou não está no PATH!" -ForegroundColor Red
    Write-Host "Instale o Python 3.7+ e tente novamente." -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar dependências
Write-Host ""
Write-Host "[INFO] Verificando dependências..." -ForegroundColor Yellow

try {
    python -c "import requests, psutil" 2>$null
    Write-Host "[OK] Dependências verificadas" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Instalando dependências necessárias..." -ForegroundColor Yellow
    pip install requests psutil
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependências!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    Write-Host "[OK] Dependências instaladas" -ForegroundColor Green
}

# Verificar configuração
if (-not (Test-Path "config.json")) {
    Write-Host "[AVISO] Arquivo config.json não encontrado! Criando configuração padrão..." -ForegroundColor Yellow
    
    $defaultConfig = @{
        server_url = "http://localhost:8080/api"
        monitoring_interval = 300
        heartbeat_interval = 60
        enable_remote_commands = $true
        auto_start = $true
        log_level = "INFO"
    } | ConvertTo-Json -Depth 2
    
    $defaultConfig | Out-File -FilePath "config.json" -Encoding UTF8
    Write-Host "[OK] Configuração padrão criada" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INICIANDO WORKTRACK AGENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Pressione Ctrl+C para parar o agente" -ForegroundColor Yellow
Write-Host "[INFO] Os logs serão salvos em: worktrack_agent.log" -ForegroundColor Yellow
Write-Host ""

# Executar o agente
try {
    python worktrack_agent.py
} catch {
    Write-Host ""
    Write-Host "[ERRO] Erro ao executar o agente!" -ForegroundColor Red
    Write-Host "Erro: $_" -ForegroundColor Red
}

# Se chegou aqui, o agente parou
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   WORKTRACK AGENT PARADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se há arquivo de log para mostrar últimas linhas
if (Test-Path "worktrack_agent.log") {
    Write-Host "[INFO] Últimas linhas do log:" -ForegroundColor Yellow
    Write-Host ""
    Get-Content "worktrack_agent.log" -Tail 5 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    Write-Host ""
}

Read-Host "Pressione Enter para sair"
