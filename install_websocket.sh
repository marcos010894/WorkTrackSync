#!/bin/bash

# Script de instalação e configuração do WebSocket Node.js para WorkTrack

echo "🔧 Instalador do WebSocket Node.js - WorkTrackSync"
echo "=================================================="

# Verificar se estamos no diretório correto
if [ ! -f "websocket-server/package.json" ]; then
    echo "❌ Execute este script a partir do diretório raiz do WorkTrack"
    exit 1
fi

# Verificar Node.js
echo "📋 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo ""
    echo "Para instalar o Node.js:"
    echo "  🍎 macOS: brew install node"
    echo "  🐧 Ubuntu: sudo apt install nodejs npm" 
    echo "  🪟 Windows: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js encontrado: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado!"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm encontrado: $NPM_VERSION"

# Ir para o diretório do servidor
cd websocket-server

echo ""
echo "📦 Instalando dependências do WebSocket..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

echo ""
echo "🔧 Configurando banco de dados..."

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️ Arquivo .env não encontrado, usando configurações padrão"
fi

echo ""
echo "✅ Instalação concluída com sucesso!"
echo ""
echo "🚀 Para iniciar o servidor WebSocket:"
echo "   ./start_websocket_nodejs.sh"
echo ""
echo "📝 Para configurar o agente Python:"
echo "   Edite agent/config.json e defina:"
echo "   {\"websocket_enabled\": true, \"websocket_url\": \"ws://127.0.0.1:8081\"}"
echo ""
echo "🌐 Acesse o dashboard em: http://localhost:8080/dashboard.php"
echo ""

# Voltar ao diretório raiz
cd ..

echo "🎉 Pronto para usar WebSocket em tempo real!"
