# 🚀 WorkTrack Agent - Instruções de Uso

## ❌ **ERRO COMUM**
```powershell
# ERRADO - NÃO FAÇA ISSO:
python .\worktrack_agent.log
```
**Problema:** Tentativa de executar arquivo `.log` como Python.

## ✅ **FORMAS CORRETAS DE EXECUTAR**

### 🎯 **Opção 1: Script Automático (Recomendado)**
```powershell
# Execute o script que faz tudo automaticamente:
.\start_agent.bat

# OU usando PowerShell:
powershell -ExecutionPolicy Bypass .\start_agent.ps1
```

### 🎯 **Opção 2: Manual**
```powershell
# 1. Navegar para o diretório
cd C:\Users\User\Documents\worktracksync\WorkTrackSync\agent

# 2. Instalar dependências (se necessário)
pip install requests psutil

# 3. Executar o agente
python worktrack_agent.py
```

## 📁 **Arquivos do Agente**
```
agent/
├── worktrack_agent.py     ← EXECUTÁVEL (arquivo Python)
├── worktrack_agent.log    ← LOG (apenas texto, NÃO executar)
├── config.json           ← Configuração
├── start_agent.bat       ← Script de inicialização (Windows)
├── start_agent.ps1       ← Script PowerShell (alternativa)
└── requirements.txt      ← Dependências Python
```

## 🔧 **Configuração (config.json)**
```json
{
    "server_url": "http://localhost:8080/api",
    "monitoring_interval": 300,
    "heartbeat_interval": 60,
    "enable_remote_commands": true,
    "auto_start": true,
    "log_level": "INFO"
}
```

## 📊 **Verificar Status**
```powershell
# Ver se o agente está rodando
tasklist | findstr python

# Ver últimas linhas do log
Get-Content worktrack_agent.log -Tail 10

# Acompanhar log em tempo real
Get-Content worktrack_agent.log -Wait
```

## 🛠️ **Solução de Problemas**

### Problema: "Python não encontrado"
```powershell
# Instalar Python 3.7+
# Baixar de: https://python.org/downloads
# Certificar que está no PATH
```

### Problema: "Módulo não encontrado"
```powershell
pip install requests psutil
```

### Problema: "Erro de conexão"
```powershell
# Verificar se o servidor está rodando
# Editar server_url em config.json
```

## 🎯 **Comandos Úteis**
```powershell
# Ver versão do Python
python --version

# Testar módulos
python -c "import requests, psutil; print('OK')"

# Parar agente
Ctrl + C

# Ver ajuda
python worktrack_agent.py --help
```

## 💡 **Lembretes**
- ✅ Execute `.py` (arquivos Python)
- ❌ NÃO execute `.log` (são apenas textos)
- 🔄 Use os scripts automáticos para evitar erros
- 📝 Consulte os logs para diagnósticos
