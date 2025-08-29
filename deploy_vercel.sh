#!/bin/bash

# Script para fazer deploy do WorkTrack WebSocket no Vercel

echo "🚀 Deploy WorkTrack WebSocket para Vercel"
echo "========================================"

# Verificar se estamos no diretório correto
if [ ! -f "vercel-websocket/package.json" ]; then
    echo "❌ Execute este script a partir do diretório raiz do WorkTrack"
    exit 1
fi

# Verificar Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado!"
    echo ""
    echo "Para instalar:"
    echo "  npm install -g vercel"
    echo ""
    echo "Para fazer login:"
    echo "  vercel login"
    exit 1
fi

cd vercel-websocket

echo "📦 Instalando dependências..."
npm install

echo ""
echo "🔧 Configurando variáveis de ambiente..."
echo ""
echo "Configure suas variáveis de ambiente no Vercel:"
echo ""
echo "vercel env add DB_HOST"
echo "vercel env add DB_USER" 
echo "vercel env add DB_PASSWORD"
echo "vercel env add DB_NAME"
echo ""

read -p "Já configurou as variáveis de ambiente? (y/N): " configured
if [[ ! $configured =~ ^[Yy]$ ]]; then
    echo ""
    echo "Configure as variáveis primeiro:"
    echo "1. vercel env add DB_HOST"
    echo "2. vercel env add DB_USER"
    echo "3. vercel env add DB_PASSWORD"
    echo "4. vercel env add DB_NAME"
    echo ""
    echo "Depois execute este script novamente."
    exit 1
fi

echo ""
echo "🚀 Fazendo deploy..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo ""
    echo "1. Copie a URL do deploy (ex: https://your-app.vercel.app)"
    echo "2. Atualize agent/config.json:"
    echo "   {"
    echo "     \"vercel_enabled\": true,"
    echo "     \"vercel_url\": \"https://your-app.vercel.app/api\""
    echo "   }"
    echo ""
    echo "3. Reinicie o agente Python"
    echo "4. Acesse o dashboard e veja o indicador 'Tempo Real Ativo (Vercel)'"
    echo ""
    echo "🔗 URLs importantes:"
    echo "   - Agent Data: https://your-app.vercel.app/api/agent-data"
    echo "   - Dashboard Stream: https://your-app.vercel.app/api/dashboard-stream"
    echo "   - Stats: https://your-app.vercel.app/api/stats"
    echo ""
else
    echo "❌ Erro no deploy"
    exit 1
fi
