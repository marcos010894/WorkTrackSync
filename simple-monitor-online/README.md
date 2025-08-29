# WorkTrack Monitor - Sistema de Monitoramento Silencioso

## 📊 Sobre
Sistema de monitoramento de atividades que funciona completamente em background, invisível ao usuário. Monitora aplicações ativas e envia dados para servidor online.

## 🚀 Instalação Rápida

### Instalar
```bash
python3 install.py
```

### Desinstalar
```bash
python3 uninstall.py
```

## 🔧 Como Funciona

### Instalação Automática
O instalador:
1. ✅ Cria diretório oculto `~/.worktrack_monitor`
2. ✅ Instala dependências Python (`requests`)
3. ✅ Configura inicialização automática do sistema
4. ✅ Inicia o monitor em background imediatamente
5. ✅ Registra o computador no servidor

### Funcionamento Invisível
- 🔒 **Processo em background** - Não aparece interface
- 👁️ **Invisível ao usuário** - Funciona silenciosamente  
- 🚀 **Autostart** - Inicia automaticamente com o sistema
- 📊 **Monitoramento contínuo** - Detecta aplicações ativas
- 🌐 **Envio automático** - Transmite dados para servidor

### Compatibilidade
- ✅ **macOS** - Via LaunchAgent
- ✅ **Windows** - Via Registro do Windows
- ✅ **Linux** - Instruções para crontab

## 📊 Funcionalidades do Dashboard

- **Cards de Computadores**: Nome, usuário, sistema, atividade atual, tempo online
- **Estatísticas**: Total de computadores, tempo médio, atividades
- **Controles**: Botões para bloquear, desligar ou reiniciar remotamente
- **Responsivo**: Funciona em desktop, tablet e mobile

## 🔧 API Endpoints

- `POST /api/data` - Receber dados dos agentes
- `GET /api/commands` - Verificar comandos pendentes
- `POST /api/commands` - Enviar comandos remotos

## 🖥️ Agente Multiplataforma

O agente funciona em:
- **Windows**: Detecção completa de janelas ativas
- **macOS**: Detecção via AppleScript
- **Linux**: Compatibilidade básica

### Recursos do Agente:
- Detecção automática de atividades
- Categorização inteligente (trabalho, entretenimento, etc.)
- Execução de comandos remotos
- Reconexão automática
- Heartbeat para manter conexão

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar localmente
vercel dev
```

## 📝 Notas

- O agente requer permissões de administrador para alguns comandos remotos
- No macOS, pode ser necessário conceder permissões de acessibilidade
- No Windows, instale `pywin32` para melhor detecção de janelas
