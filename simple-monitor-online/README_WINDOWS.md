# 🪟 WorkTrack Monitor - Instalação Windows

## 📦 Instalação Rápida

### 1. Download
Baixe os arquivos:
- `install.bat` 
- `uninstall.bat`

### 2. Executar Instalador
1. **Clique duplo em `install.bat`**
2. ✅ Instalação automática em 30 segundos
3. ✅ Monitor funcionando invisível
4. ✅ Inicialização automática configurada

### 3. Verificar Instalação
- Monitor estará rodando em background
- Aparecerá no dashboard online: https://simple-monitor-online-kbgfqvu11-marcos10895s-projects.vercel.app
- Login: `gneconstrucoes@outlook.com.br` / `gne254575`

## 🔧 O que o Instalador Faz

### Verificações
- ✅ Verifica se Python está instalado
- ✅ Instala dependência `requests`
- ✅ Cria diretório oculto `%USERPROFILE%\.worktrack_monitor`

### Configuração Automática
- 🔒 **Monitor invisível** - Sem janelas ou interfaces
- 🚀 **Autostart** - Inicia com Windows automaticamente  
- 📊 **Monitoramento** - Detecta aplicações ativas
- 🌐 **Transmissão** - Envia dados para servidor

### Localização dos Arquivos
```
C:\Users\[SEU_USUARIO]\.worktrack_monitor\
├── monitor.py          # Script principal
└── monitor.log         # Log de atividades
```

## 🔍 Verificação Manual

### Ver se está rodando
1. **Ctrl + Shift + Esc** (Gerenciador de Tarefas)
2. Aba **Detalhes**
3. Procurar por `python.exe` executando `monitor.py`

### Ver logs
1. **Win + R** → `%USERPROFILE%\.worktrack_monitor`
2. Abrir `monitor.log` com Bloco de Notas

### Verificar autostart
1. **Win + R** → `regedit`
2. Navegar para: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
3. Procurar entrada `WorkTrackMonitor`

## 🗑️ Desinstalação

### Automática
**Clique duplo em `uninstall.bat`**

### Manual (se necessário)
1. **Parar processo:**
   - Ctrl + Shift + Esc → Finalizar `python.exe` (monitor)

2. **Remover autostart:**
   - Win + R → `regedit`
   - Deletar: `HKEY_CURRENT_USER\...\Run\WorkTrackMonitor`

3. **Deletar arquivos:**
   - Win + R → `%USERPROFILE%\.worktrack_monitor`
   - Deletar pasta inteira

## ⚠️ Requisitos

### Sistema
- ✅ **Windows 7/8/10/11** (32 ou 64 bits)
- ✅ **Python 3.7+** instalado
- ✅ **Conexão com internet**

### Instalar Python (se necessário)
1. Ir para: https://www.python.org/downloads/
2. Baixar **Python 3.11** ou mais recente
3. **IMPORTANTE:** Marcar "Add Python to PATH" na instalação
4. Reiniciar computador após instalação

## 🛡️ Segurança

### O que o monitor faz:
- ✅ Detecta nome da aplicação ativa
- ✅ Detecta título da janela ativa
- ✅ Envia dados via HTTPS
- ✅ Funciona apenas para usuário atual

### O que NÃO faz:
- ❌ Não captura telas
- ❌ Não registra senhas
- ❌ Não acessa arquivos pessoais
- ❌ Não requer privilégios administrativos

## 🆘 Solução de Problemas

### "Python não encontrado"
```bash
# Instalar Python:
# https://www.python.org/downloads/
# Marcar "Add to PATH" na instalação
```

### "Erro ao instalar requests"
```bash
# Tentar manualmente:
pip install --user requests
```

### "Monitor não aparece no dashboard"
```bash
# Verificar logs:
# Win + R → %USERPROFILE%\.worktrack_monitor
# Abrir monitor.log
```

### "Erro de permissão"
```bash
# Executar como administrador:
# Clicar direito em install.bat → "Executar como administrador"
```

### ⚠️ "Monitor não inicia automaticamente após reiniciar"

#### **Solução Rápida:**
1. **Executar:** `fix_autostart.bat`
2. **Verificar:** `check_autostart.bat`

#### **Diagnóstico Manual:**
1. **Win + R** → `regedit`
2. Navegar para: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
3. Verificar se existe entrada `WorkTrackMonitor`

#### **Correção Manual (se necessário):**
1. **Win + R** → `shell:startup`
2. Criar arquivo: `WorkTrackMonitor.bat`
3. Conteúdo do arquivo:
```bat
@echo off
python "%USERPROFILE%\.worktrack_monitor\monitor.py"
```

#### **Verificação:**
1. **Ctrl + Shift + Esc** (Gerenciador de Tarefas)
2. Procurar processo `python.exe`
3. Verificar no dashboard online

## 📞 Suporte

### Dashboard Online
- URL: https://simple-monitor-online-kbgfqvu11-marcos10895s-projects.vercel.app
- Login: `gneconstrucoes@outlook.com.br`
- Senha: `gne254575`

### Verificar Status
- Ver logs em: `%USERPROFILE%\.worktrack_monitor\monitor.log`
- Gerenciador de Tarefas: procurar `python.exe`

### Reinstalar
1. Executar `uninstall.bat`
2. Executar `install.bat`
