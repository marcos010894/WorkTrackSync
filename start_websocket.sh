#!/bin/bash

# Script para iniciar o servidor WebSocket do WorkTrack

echo "🚀 Iniciando servidor WebSocket do WorkTrack..."

# Ir para o diretório web
cd "$(dirname "$0")/web"

# Verificar se o PHP está disponível
if ! command -v php &> /dev/null; then
    echo "❌ Erro: PHP não encontrado. Instale o PHP primeiro."
    exit 1
fi

# Verificar se o arquivo do servidor existe
if [ ! -f "websocket_server.php" ]; then
    echo "❌ Erro: websocket_server.php não encontrado."
    exit 1
fi

echo "📡 Servidor WebSocket será iniciado em 127.0.0.1:8081"
echo "🔄 Para parar o servidor, pressione Ctrl+C"
echo "📊 Dashboard: http://localhost:8080/dashboard.php"
echo ""

# Iniciar servidor WebSocket
php websocket_server.php
