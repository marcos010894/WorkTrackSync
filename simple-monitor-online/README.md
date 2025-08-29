# Monitor Online - Sistema de Monitoramento Remoto

Sistema completo de monitoramento de atividade em tempo real via web.

## 🌟 Recursos

- **Dashboard Web**: Interface moderna e responsiva
- **Monitoramento Multiplataforma**: Windows e macOS
- **Controle Remoto**: Bloquear, desligar ou reiniciar computadores
- **Tempo Real**: Atualizações automáticas a cada 15 segundos
- **Deploy na Nuvem**: Hospedado no Vercel

## 🚀 Como Usar

### 1. Deploy Online (Recomendado)

```bash
cd simple-monitor-online
vercel --prod
```

### 2. Configurar Agente nos Computadores

```bash
# Instalar dependências
pip install -r agent/requirements.txt

# Executar agente (substitua pela URL do seu deploy)
python agent/monitor_online.py https://sua-url.vercel.app
```

### 3. Acessar Dashboard

Acesse a URL do deploy para ver o dashboard com:
- Computadores conectados
- Atividades em tempo real
- Controles remotos
- Estatísticas de uso

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
