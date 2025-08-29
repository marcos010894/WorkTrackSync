@echo off
REM Script de instalação do agente - Windows

echo 🌐 INSTALANDO AGENTE DO MONITOR ONLINE
echo ======================================

REM Instalar dependências
echo 📦 Instalando dependências...
pip install requests pywin32 psutil

REM Baixar agente (opcional - ou usar o arquivo local)
echo 📥 Agente está pronto!

REM Executar agente
echo 🚀 Iniciando agente...
echo URL do servidor: https://simple-monitor-online-aqd3dzk8d-marcos10895s-projects.vercel.app

python monitor_online.py https://simple-monitor-online-aqd3dzk8d-marcos10895s-projects.vercel.app

pause
