#!/bin/bash
# Script simplificado para executar o agente

echo "🚀 INICIANDO AGENTE DO MONITOR ONLINE"
echo "===================================="

# Instalar requests se não estiver instalado
python3 -c "import requests" 2>/dev/null || {
    echo "📦 Instalando requests..."
    pip3 install requests
}

# Executar agente
echo "🌐 Conectando ao servidor..."
echo "Dashboard: https://simple-monitor-online-eqh2p2ir4-marcos10895s-projects.vercel.app"
echo ""

python3 monitor_online.py
