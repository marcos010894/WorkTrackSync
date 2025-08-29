#!/bin/bash
# Script de instalação do agente - Linux/macOS

echo "🌐 INSTALANDO AGENTE DO MONITOR ONLINE"
echo "======================================"

# Baixar agente
echo "📥 Baixando agente..."
curl -o monitor_online.py https://raw.githubusercontent.com/vercel/simple-monitor-online/main/agent/monitor_online.py

# Instalar dependências
echo "📦 Instalando dependências..."
pip3 install requests

# Executar agente
echo "🚀 Iniciando agente..."
echo "URL do servidor: https://simple-monitor-online-aqd3dzk8d-marcos10895s-projects.vercel.app"

python3 monitor_online.py https://simple-monitor-online-aqd3dzk8d-marcos10895s-projects.vercel.app
