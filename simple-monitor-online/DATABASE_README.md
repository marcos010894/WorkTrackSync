# WorkTrackSync - Sistema de Monitoramento com MySQL

Sistema de monitoramento de dispositivos com persistência em MySQL para controle completo de histórico.

## 🗄️ Configuração do Banco de Dados

### Opção 1: MySQL Local

1. **Instalar MySQL**:
   ```bash
   # macOS
   brew install mysql
   brew services start mysql
   
   # Ubuntu/Debian
   sudo apt install mysql-server
   sudo systemctl start mysql
   
   # Windows
   # Baixar do site oficial: https://dev.mysql.com/downloads/
   ```

2. **Configurar variáveis de ambiente**:
   ```bash
   export MYSQL_HOST=localhost
   export MYSQL_PORT=3306
   export MYSQL_USER=root
   export MYSQL_PASSWORD=sua_senha
   export MYSQL_DATABASE=worktrack_sync
   ```

3. **Configurar banco**:
   ```bash
   node setup-db.js setup
   ```

### Opção 2: MySQL em Nuvem (Recomendado para Produção)

#### PlanetScale (Gratuito)
1. Criar conta em [planetscale.com](https://planetscale.com)
2. Criar novo banco de dados
3. Obter string de conexão
4. Configurar variáveis no Vercel:
   ```
   MYSQL_HOST=aws.connect.psdb.cloud
   MYSQL_USER=seu_usuario
   MYSQL_PASSWORD=sua_senha
   MYSQL_DATABASE=worktrack_sync
   ```

#### Railway (Gratuito)
1. Criar conta em [railway.app](https://railway.app)
2. Adicionar MySQL
3. Copiar credenciais
4. Configurar no Vercel

#### Amazon RDS / Google Cloud SQL
- Para projetos enterprise
- Alta disponibilidade
- Backup automático

## 🚀 Deploy

1. **Configurar variáveis no Vercel**:
   ```bash
   vercel env add MYSQL_HOST
   vercel env add MYSQL_USER
   vercel env add MYSQL_PASSWORD
   vercel env add MYSQL_DATABASE
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## 📊 Estrutura do Banco

### Tabelas Principais:

- **`devices`** - Dispositivos registrados
- **`activities`** - Atividades em tempo real
- **`daily_history`** - Histórico diário agregado
- **`commands_log`** - Log de comandos enviados
- **`system_stats`** - Estatísticas do sistema

### Funcionalidades:

✅ **Persistência completa** - Dados nunca são perdidos  
✅ **Histórico ilimitado** - Controle de retenção configurável  
✅ **Performance otimizada** - Cache + MySQL  
✅ **Estatísticas avançadas** - Relatórios detalhados  
✅ **Backup automático** - Dependendo do provedor  

## 🔧 Comandos Úteis

```bash
# Testar conexão
node setup-db.js test

# Configurar banco completo
node setup-db.js setup

# Configurar com dados de exemplo
node setup-db.js setup --sample-data

# Ver logs em produção
vercel logs

# Conectar ao banco local
mysql -u root -p worktrack_sync
```

## 📈 Benefícios vs Memória

| Recurso | Memória RAM | MySQL |
|---------|-------------|-------|
| Persistência | ❌ Perdido ao reiniciar | ✅ Permanente |
| Histórico | ❌ Limitado | ✅ Ilimitado |
| Relatórios | ❌ Básico | ✅ Avançado |
| Performance | ✅ Muito rápida | ✅ Rápida com cache |
| Escalabilidade | ❌ Limitada | ✅ Alta |
| Backup | ❌ Nenhum | ✅ Automático |
| Custo | ✅ Gratuito | 💰 Gratuito até 1GB |

## 🛠️ Manutenção

O sistema inclui:
- Limpeza automática de dados antigos (90 dias)
- Atualização de status online/offline (5 min timeout)
- Sincronização cache ↔ MySQL (1 min)
- Fallback para memória se MySQL falhar

## 🔍 Monitoramento

- Logs detalhados com emojis para facilitar debug
- Indicador de fonte dos dados (MySQL vs Fallback)
- Estatísticas em tempo real
- Alertas de conexão

**Status atual**: ✅ Sistema híbrido com fallback inteligente!
