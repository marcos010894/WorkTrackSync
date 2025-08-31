# Sistema de Controle pelo Servidor - WorkTrackSync

## 🎯 Nova Arquitetura Implementada

### 📡 **Agente (Cliente)**
- ✅ **Envia apenas heartbeat** a cada 60 segundos
- ✅ **Informa estado**: "Estou online" + atividade atual
- ✅ **Não calcula tempo** - apenas monitora atividade
- ✅ **Dados do dispositivo** enviados apenas no registro inicial

### 🖥️ **Servidor (Backend)**
- ✅ **Controla todo o tempo** baseado em heartbeats
- ✅ **Incrementa automaticamente** quando recebe heartbeat
- ✅ **Salva dados do dispositivo** na primeira conexão
- ✅ **Gerencia acumulação e persistência** no banco

---

## 🔧 Como Funciona

### Fluxo Simplificado:
```
AGENTE                    SERVIDOR                     BANCO
------                    --------                     -----
💓 Heartbeat       →      Calcula: passou 1min   →     
💓 Heartbeat       →      Incrementa: +1min      →     
💓 Heartbeat       →      Acumula: 3min          →     
...                       ...                    →     
💓 Heartbeat       →      Acumula: 10min         →     💾 Salva 10min
💓 Heartbeat       →      Incrementa: +1min      →     
```

### Exemplo Prático:
```
14:30 - Agente: "💓 Heartbeat - Programando"
14:31 - Servidor: "⏱️ +1min para device123 (Total: 1min)"
14:32 - Agente: "💓 Heartbeat - Programando"  
14:32 - Servidor: "⏱️ +1min para device123 (Total: 2min)"
...
14:40 - Servidor: "💾 Salvando 10min no banco"
```

---

## 📊 Vantagens da Nova Implementação

### ✅ **Centralização**
- **Antes**: Agente calculava tempo + enviava dados
- **Agora**: Servidor controla tudo, agente só reporta estado

### ✅ **Simplicidade do Agente**
- **Antes**: Lógica complexa de tempo e data
- **Agora**: Apenas heartbeat simples

### ✅ **Consistência**
- **Antes**: Diferentes agentes = diferentes cálculos
- **Agora**: Servidor = cálculo único e consistente

### ✅ **Persistência de Dados**
- **Antes**: Dados do dispositivo perdidos se agente crashar
- **Agora**: Dados salvos no servidor permanentemente

---

## 🛠️ Estrutura de Dados

### Heartbeat do Agente:
```json
{
  "type": "heartbeat",
  "computer_id": "macbook-marcos",
  "computer_name": "MacBook Pro - Escritório",
  "user_name": "Marcos Paulo", 
  "os_info": "macOS Sonoma",
  "current_activity": "Programando",
  "active_window": "VS Code",
  "timestamp": "2025-08-31T14:30:00",
  "is_active": true
}
```

### Controle do Servidor:
```javascript
deviceLastSeen = {
  "macbook-marcos": 1693487400000 // timestamp último heartbeat
}

dailyAccumulator = {
  "macbook-marcos_2025-08-31": {
    device_id: "macbook-marcos",
    date: "2025-08-31",
    minutes: 15,        // Tempo acumulado hoje
    lastSave: 10,       // Último save no banco
    lastActivity: {...} // Última atividade
  }
}
```

---

## 📱 Interface do Dashboard

### Dados em Tempo Real:
- **Nome**: Salvo permanentemente no servidor
- **Tempo Ativo**: Calculado pelo servidor baseado em heartbeats
- **Atividade Atual**: Enviada a cada heartbeat
- **Status**: Online (recebeu heartbeat < 2min) / Offline

### Exemplo de Resposta da API:
```json
{
  "computers": [
    {
      "id": "macbook-marcos",
      "name": "MacBook Pro - Escritório",
      "user_name": "Marcos Paulo",
      "today_minutes": 15,
      "today_display": "15min",
      "saved_minutes": 10,
      "pending_minutes": 5,
      "current_activity": "Programando",
      "is_online": true
    }
  ]
}
```

---

## ⚙️ Configuração e Uso

### 1. **Configurar Dispositivo**:
```bash
cd agent
python3 setup_device.py
```

### 2. **Executar Monitor**:
```bash
python3 monitor_online.py
```

### 3. **Logs do Agente**:
```
💓 Sistema: Heartbeat a cada 60s (servidor controla tempo)
💓 Heartbeat enviado - Programando (Heartbeats hoje: 5)
```

### 4. **Logs do Servidor**:
```
💓 Heartbeat recebido: macbook-marcos - Programando
⏱️ Servidor incrementou: +1min para macbook-marcos (Total: 15min)
💾 Salvando 10min no banco: macbook-marcos
✅ MacBook Pro: 15min acumulados (Servidor controla tempo)
```

---

## 🔄 Detecção de Problemas

### Se Agente Parar:
- **Antes**: Tempo continuava incrementando incorretamente
- **Agora**: Servidor para de incrementar automaticamente

### Se Agente Ficar Instável:
- **Antes**: Dados inconsistentes enviados
- **Agora**: Servidor ignora heartbeats muito espaçados (>3min)

### Se Servidor Reiniciar:
- **Antes**: Dados perdidos
- **Agora**: Dados salvos automaticamente + backup a cada 5min

---

## 🌐 URLs Atualizadas

- **Dashboard**: https://simple-monitor-online-rd39o2gbx-marcos10895s-projects.vercel.app/dashboard.html
- **Histórico**: https://simple-monitor-online-rd39o2gbx-marcos10895s-projects.vercel.app/history_daily.html
- **API**: https://simple-monitor-online-rd39o2gbx-marcos10895s-projects.vercel.app/api/data

---

## 🧪 Teste a Nova Implementação

### Execute o agente e observe:

1. **Agente**: Envia apenas heartbeats simples
2. **Servidor**: Calcula e incrementa tempo automaticamente  
3. **Dashboard**: Mostra tempo em tempo real
4. **Banco**: Salva automaticamente a cada 10min

### Diferenças Visuais:

**Antes**:
```
📊 +1min enviado - Programando (Enviados hoje: 15min)
```

**Agora**:
```
💓 Heartbeat enviado - Programando (Heartbeats hoje: 15)
```

**Servidor controla tudo! 🎯**
