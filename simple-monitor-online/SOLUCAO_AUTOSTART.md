# 🔧 Solução: Monitor não inicia automaticamente

## 🚨 **Problema Identificado**
O monitor foi instalado mas não está iniciando automaticamente após reiniciar o Windows.

## ⚡ **Soluções Rápidas**

### **1. Correção Automática**
Execute o script de correção:
```
fix_autostart.bat
```

### **2. Verificação de Status**
Para diagnosticar o problema:
```
check_autostart.bat
```

### **3. Reinstalação (se necessário)**
```
uninstall.bat
install.bat
```

## 🔍 **Diagnóstico Manual**

### **Verificar Registro do Windows:**
1. **Win + R** → `regedit`
2. Navegar para: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
3. Procurar entrada: `WorkTrackMonitor`
4. Valor deve ser: `"python" "C:\Users\[USUARIO]\.worktrack_monitor\monitor.py"`

### **Verificar Pasta Startup:**
1. **Win + R** → `shell:startup`
2. Verificar se existe: `WorkTrackMonitor.bat`

### **Verificar Task Scheduler:**
1. **Win + R** → `taskschd.msc`
2. Procurar tarefa: `WorkTrackMonitor`

## 🛠️ **Correção Manual**

### **Método 1: Pasta Startup (Mais Simples)**
1. **Win + R** → `shell:startup`
2. **Clicar direito** → Novo → Documento de Texto
3. **Renomear** para: `WorkTrackMonitor.bat`
4. **Editar** com conteúdo:
```bat
@echo off
cd /d "%USERPROFILE%\.worktrack_monitor"
start /min python monitor.py
```
5. **Salvar** e fechar

### **Método 2: Task Scheduler (Mais Robusto)**
1. **Win + R** → `taskschd.msc`
2. **Ação** → Criar Tarefa Básica
3. **Nome:** `WorkTrackMonitor`
4. **Gatilho:** Ao fazer logon
5. **Ação:** Iniciar programa
6. **Programa:** `python`
7. **Argumentos:** `%USERPROFILE%\.worktrack_monitor\monitor.py`
8. **Finalizar**

## ✅ **Verificação de Funcionamento**

### **Teste Imediato:**
```bat
# Abrir Prompt de Comando
cd %USERPROFILE%\.worktrack_monitor
python monitor.py
```

### **Teste após Reiniciar:**
1. **Reiniciar** o computador
2. **Aguardar** 1-2 minutos
3. **Verificar** no dashboard: https://simple-monitor-online-kbgfqvu11-marcos10895s-projects.vercel.app
4. **Login:** `gneconstrucoes@outlook.com.br` / `gne254575`

### **Verificar Processo:**
1. **Ctrl + Shift + Esc**
2. **Aba Detalhes**
3. **Procurar:** `python.exe`
4. **Linha de comando** deve conter: `monitor.py`

## 📋 **Logs e Debug**

### **Ver Logs:**
```
notepad %USERPROFILE%\.worktrack_monitor\monitor.log
```

### **Logs Típicos de Sucesso:**
```
[2025-08-29 10:30:15] Monitor iniciado - DESKTOP-ABC123
[2025-08-29 10:30:16] Registered
[2025-08-29 10:30:20] Sent: Using chrome.exe - Google
```

### **Problemas Comuns nos Logs:**
- **"Python não encontrado"** → Reinstalar Python
- **"Erro de conexão"** → Verificar internet
- **"Import Error"** → Instalar `pip install requests`

## 🔄 **Se Nada Funcionar**

### **Reinstalação Completa:**
1. **Executar:** `uninstall.bat`
2. **Reiniciar** computador
3. **Executar:** `install.bat` como administrador
4. **Executar:** `fix_autostart.bat`
5. **Testar:** `check_autostart.bat`

### **Suporte:**
- Dashboard: https://simple-monitor-online-kbgfqvu11-marcos10895s-projects.vercel.app
- Logs: `%USERPROFILE%\.worktrack_monitor\monitor.log`
