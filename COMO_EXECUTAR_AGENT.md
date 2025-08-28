# ❌ ERRO COMUM - Como Executar o WorkTrack Agent Corretamente

## 🚫 **ERRO:**
```powershell
PS C:\Users\User\Documents\worktracksync\WorkTrackSync\agent> python .\worktrack_agent.log
```
**Problema:** Tentativa de executar um arquivo `.log` (texto) como se fosse Python.

## ✅ **SOLUÇÃO - Comando Correto:**

### 1. **Executar o Agente:**
```powershell
# Comando correto para iniciar o agente
python .\worktrack_agent.py

# OU com Python 3 explícito
python3 .\worktrack_agent.py
```

### 2. **Ver os Logs (se existirem):**
```powershell
# Para visualizar o arquivo de log (se existir)
type .\worktrack_agent.log

# OU para acompanhar em tempo real
Get-Content .\worktrack_agent.log -Wait
```

### 3. **Verificar Status:**
```powershell
# Listar arquivos no diretório
dir

# Verificar se o agente está rodando
tasklist | findstr python
```

## 📁 **Estrutura de Arquivos:**
```
agent/
├── worktrack_agent.py    ← Arquivo Python EXECUTÁVEL
├── worktrack_agent.log   ← Arquivo de LOG (apenas texto)
├── config.json          ← Configuração
├── installer.py         ← Instalador
└── requirements.txt     ← Dependências
```

## 🎯 **Passos Corretos:**

### Passo 1: Navegar para o diretório
```powershell
cd C:\Users\User\Documents\worktracksync\WorkTrackSync\agent
```

### Passo 2: Verificar dependências
```powershell
pip install -r requirements.txt
```

### Passo 3: Executar o agente
```powershell
python worktrack_agent.py
```

### Passo 4: Verificar funcionamento
```powershell
# O agente deve mostrar:
# - Computer ID gerado
# - Conexão com servidor
# - Status de funcionamento
```

## 🔧 **Configuração do Servidor:**
Edite `config.json` se necessário:
```json
{
    "server_url": "http://SEU_SERVIDOR:PORTA/api",
    "monitoring_interval": 300,
    "heartbeat_interval": 60,
    "enable_remote_commands": true,
    "auto_start": true,
    "log_level": "INFO"
}
```

## 💡 **Dicas:**
- `.py` = arquivo Python (executável)
- `.log` = arquivo de texto (apenas visualizar)
- Use `python arquivo.py` para executar
- Use `type arquivo.log` para ver logs
