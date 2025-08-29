#!/bin/bash

# Script para iniciar o servidor WebSocket Node.js do WorkTrack

echo "🚀 Iniciando servidor WebSocket Node.js do WorkTrack..."

# Ir para o diretório do servidor websocket
cd "$(dirname "$0")/websocket-server"

# Verificar se o Node.js está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não encontrado. Instale o Node.js primeiro:"
    echo "   - macOS: brew install node"
    echo "   - Ubuntu: sudo apt install nodejs npm"
    echo "   - Windows: https://nodejs.org/"
    exit 1
fi

# Verificar se o npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ Erro: npm não encontrado. Instale o npm primeiro."
    exit 1
fi

# Verificar se o arquivo do servidor existe
if [ ! -f "websocket-server.js" ]; then
    echo "❌ Erro: websocket-server.js não encontrado."
    exit 1
fi

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências."
        exit 1
    fi
fi

echo ""
echo "📡 Servidor WebSocket Node.js será iniciado em 127.0.0.1:8081"
echo "🔄 Para parar o servidor, pressione Ctrl+C"
echo "📊 Dashboard: http://localhost:8080/dashboard.php"
echo "🖥️ Configure os agentes para ws://127.0.0.1:8081"
echo ""

# Iniciar servidor WebSocket
node websocket-server.js
