# 🔥 WorkTrack WebSocket no Vercel

WebSocket em tempo real usando **Vercel Edge Functions** e **Server-Sent Events (SSE)**!

## ✨ Como Funciona no Vercel

Como o Vercel não suporta WebSockets tradicionais, usamos:

- **📡 Server-Sent Events (SSE)** para streaming em tempo real
- **⚡ Edge Functions** para processamento rápido
- **🌍 Cache global** distribuído
- **🔄 HTTP APIs** para receber dados dos agentes

## 🚀 Deploy Rápido

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
vercel login
```

### 2. Fazer Deploy

```bash
# Usar o script automático
./deploy_vercel.sh
```

Ou manualmente:
```bash
cd vercel-websocket
npm install
vercel --prod
```

### 3. Configurar Variáveis de Ambiente

```bash
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
```

### 4. Configurar Agente

Atualize `agent/config.json`:

```json
{
  "vercel_enabled": true,
  "vercel_url": "https://your-app.vercel.app/api",
  "websocket_enabled": false
}
```

## 📡 Arquitetura Vercel

```mermaid
graph TD
    A[Agente Python] -->|HTTP POST| B[Vercel Edge Function]
    B -->|Cache Global| C[Vercel Edge Cache]
    C -->|SSE Stream| D[Dashboard Browser]
    B -->|Backup| E[MySQL Database]
    
    F[Dashboard] -->|SSE Connection| G[/api/dashboard-stream]
    H[Agente] -->|Data POST| I[/api/agent-data]
    J[Stats API] -->|GET| K[/api/stats]
```

## 🔗 Endpoints da API

### `/api/agent-data` (POST)
Recebe dados dos agentes
```json
{
  "type": "agent_data",
  "computer_id": "ABC123",
  "usage_minutes": 125,
  "running_programs": [...],
  "active_window": {...}
}
```

### `/api/dashboard-stream` (GET SSE)
Stream de dados para o dashboard
```
data: {"type": "computers_update", "data": {...}}

data: {"type": "stats_update", "data": {...}}
```

### `/api/stats` (GET)
Estatísticas atuais
```json
{
  "success": true,
  "stats": {
    "total_computers": 5,
    "online_computers": 3,
    "total_usage_today": 720
  }
}
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente
```bash
# Banco de dados
DB_HOST=your-db-host
DB_USER=worktrack_user
DB_PASSWORD=your-password
DB_NAME=worktrack_db
```

### Configuração do Agente
```json
{
  "server_url": "https://worktracksync.online/api",
  "vercel_url": "https://your-app.vercel.app/api",
  "vercel_enabled": true,
  "websocket_enabled": false,
  "websocket_interval": 5,
  "monitoring_interval": 60,
  "heartbeat_interval": 60
}
```

## 🎯 Performance

### Edge Functions
- ⚡ **Latência**: <50ms globalmente
- 🌍 **Distribuição**: 40+ regiões
- 📈 **Escalabilidade**: Automática
- 💾 **Cache**: Em memória distribuído

### Server-Sent Events
- 🔄 **Conexão persistente** sem WebSocket
- 📡 **Streaming** em tempo real
- 🔌 **Reconexão automática**
- 📱 **Compatibilidade** total com browsers

## 🐛 Troubleshooting

### Deploy Falha
```bash
# Verificar login
vercel whoami

# Verificar projeto
vercel ls

# Logs detalhados
vercel logs your-deployment-url
```

### SSE não conecta
1. **Verificar CORS** - deve estar configurado
2. **Verificar URL** - https://your-app.vercel.app/api/dashboard-stream
3. **Firewall** - liberar conexões SSE
4. **Browser** - suporte a EventSource

### Agente não envia dados
1. **Verificar config.json** - vercel_enabled: true
2. **Verificar URL** - vercel_url correto
3. **Logs** - worktrack_agent.log
4. **Conexão** - ping para vercel.app

### Dados não aparecem
1. **Cache** - pode levar até 5 segundos
2. **Banco** - verificar conexão MySQL
3. **Logs** - vercel logs
4. **Browser** - Console (F12)

## 📊 Monitoramento

### Logs do Vercel
```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs por função
vercel logs --function=api/agent-data

# Ver métricas
vercel analytics
```

### Dashboard Vercel
- 📈 **Métricas**: Requests, latência, erros
- 🔍 **Logs**: Tempo real
- 💰 **Billing**: Uso e custos
- ⚙️ **Settings**: Variáveis, domínios

## 💡 Dicas de Otimização

### Cache Strategy
```javascript
// Cache no Edge por 30 segundos
response.headers.set('Cache-Control', 'max-age=30, s-maxage=30');
```

### Error Handling
```javascript
// Graceful degradation
try {
  await saveToDatabase();
} catch (error) {
  console.error('DB error, using cache only');
}
```

### Performance
```javascript
// Cleanup automático
setInterval(cleanupCache, 5 * 60 * 1000);
```

## 🔗 Links Úteis

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Edge Functions**: https://vercel.com/docs/concepts/functions/edge-functions
- **Server-Sent Events**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## 🎉 Vantagens do Vercel

### ✅ **Performance**
- 🚀 Edge Functions globais
- ⚡ Latência ultra-baixa
- 📈 Auto-scaling
- 💾 Cache distribuído

### ✅ **Facilidade**
- 🔄 Deploy automático
- 🌍 CDN global
- 📱 HTTPS automático
- 🔧 Zero configuração

### ✅ **Confiabilidade**
- 🛡️ 99.9% uptime
- 🔄 Failover automático
- 📊 Monitoramento integrado
- 🚨 Alertas automáticos

---

🔥 **Agora o WorkTrack roda globalmente com Vercel!**
