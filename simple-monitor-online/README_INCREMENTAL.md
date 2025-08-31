# Sistema de Histórico Diário - WorkTrackSync

## 🚀 Nova Funcionalidade Implementada

O sistema agora possui um **controle de tempo incremental** com **histórico diário completo**!

### ⏰ Como Funciona

#### 1. **Agente (Cliente)**
- ✅ Envia **1 minuto** a cada minuto que passa
- ✅ Controla automaticamente a mudança de dia
- ✅ Reinicia contagem no novo dia
- ✅ Suporte a configuração personalizada (JSON)

#### 2. **Backend (Servidor)**
- ✅ Recebe incrementos de 1 minuto
- ✅ Acumula tempo por dia no banco de dados
- ✅ Salva automaticamente no histórico quando muda o dia
- ✅ Protege contra dados anômalos

#### 3. **Frontend (Interface)**
- ✅ Dashboard em tempo real
- ✅ **Página de histórico diário** (`history_daily.html`)
- ✅ Tabela com dados por data
- ✅ Estatísticas consolidadas

---

## 📊 Estrutura do Sistema

### Banco de Dados
```sql
-- Nova tabela para histórico diário
CREATE TABLE daily_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    total_minutes INT DEFAULT 0,
    activities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_device_date (device_id, date)
);
```

### Fluxo de Dados

```
AGENTE                    BACKEND                    BANCO
------                    -------                    -----
Passa 1 minuto      →     Recebe +1min         →     Acumula em daily_history
Envia incremento    →     Valida dados         →     Atualiza total_minutes
Novo dia detectado  →     Cria novo registro   →     Nova linha na tabela
```

---

## 🔧 Como Usar

### 1. **Configurar Dispositivo**
```bash
cd agent
python3 setup_device.py
```

### 2. **Executar Monitor**
```bash
python3 monitor_online.py
```

### 3. **Acessar Dashboard**
- **Tempo Real:** https://simple-monitor-online-7o13bhcb9-marcos10895s-projects.vercel.app/dashboard.html
- **Histórico:** https://simple-monitor-online-7o13bhcb9-marcos10895s-projects.vercel.app/history_daily.html

---

## 📱 Interface do Usuário

### Dashboard Principal
- ⚡ Dados em tempo real
- 📊 Dispositivos ativos
- ⏱️ Tempo acumulado do dia
- 🔄 Atualização automática

### Histórico Diário
- 📅 Dados organizados por data
- 📈 Estatísticas consolidadas
- 🔍 Detalhes por dispositivo
- 📋 Exportação de dados

---

## 🛠️ APIs Disponíveis

### Dados em Tempo Real
```
GET /api/data
- Dispositivos ativos
- Tempo atual do dia
- Estatísticas gerais
```

### Histórico Diário
```
GET /api/history
- Todos os dispositivos: /api/history
- Dispositivo específico: /api/history?device_id=DEVICE_ID
- Limitar resultados: /api/history?limit=50
```

---

## 📈 Exemplo de Dados

### Resposta da API de Histórico
```json
{
  "success": true,
  "daily_summary": {
    "2025-08-31": {
      "date": "2025-08-31",
      "total_devices": 2,
      "total_minutes": 480,
      "total_hours": 8,
      "devices": [
        {
          "device_id": "macbook-marcos",
          "device_name": "MacBook Pro - Escritório",
          "user_name": "Marcos Paulo",
          "total_minutes": 300,
          "total_hours": 5,
          "remaining_minutes": 0
        }
      ]
    }
  },
  "total_records": 15,
  "total_dates": 3
}
```

---

## ⚙️ Configuração Personalizada

### Arquivo device_config.json
```json
{
  "device_name": "MacBook Pro - Escritório",
  "user_name": "Marcos Paulo",
  "description": "Computador principal do escritório",
  "department": "Desenvolvimento",
  "location": "São Paulo",
  "tags": ["desenvolvimento", "principal", "escritorio"]
}
```

---

## 🔄 Migração do Sistema Antigo

### Compatibilidade
- ✅ Sistema antigo continua funcionando
- ✅ Novos agentes usam incrementos
- ✅ Backend detecta automaticamente o tipo
- ✅ Dados históricos preservados

### Atualizando Agentes
1. Substituir `monitor_online.py` pela nova versão
2. Configurar `device_config.json` (opcional)
3. Reiniciar o monitor

---

## 📊 Benefícios do Novo Sistema

### ⏰ Precisão Temporal
- **Antes:** Tempo total da sessão
- **Agora:** Incrementos de 1 minuto precisos

### 📈 Histórico Confiável
- **Antes:** Dados em memória temporária
- **Agora:** Persistência permanente no MySQL

### 📱 Interface Melhorada
- **Antes:** Apenas dashboard básico
- **Agora:** Dashboard + Histórico detalhado

### 🛡️ Robustez
- **Antes:** Perda de dados ao reiniciar
- **Agora:** Recuperação automática de estado

---

## 🚀 Próximos Passos

1. **Testar o sistema** com múltiplos dispositivos
2. **Configurar nomes personalizados** com `device_config.json`
3. **Monitorar histórico** na nova página
4. **Exportar relatórios** mensais/semanais

---

## 🔗 Links Úteis

- **Dashboard:** https://simple-monitor-online-7o13bhcb9-marcos10895s-projects.vercel.app/dashboard.html
- **Histórico:** https://simple-monitor-online-7o13bhcb9-marcos10895s-projects.vercel.app/history_daily.html
- **API Dados:** https://simple-monitor-online-7o13bhcb9-marcos10895s-projects.vercel.app/api/data
- **API Histórico:** https://simple-monitor-online-7o13bhcb9-marcos10895s-projects.vercel.app/api/history

---

## 💡 Suporte

Para dúvidas ou problemas:
1. Verificar logs do agente
2. Testar conectividade com a API
3. Verificar configuração do banco de dados
4. Consultar a documentação técnica

**Sistema implementado e funcionando! 🎉**
