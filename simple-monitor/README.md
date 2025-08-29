# 🖥️ Sistema de Monitoramento em Tempo Real

Sistema simples e completo para monitorar atividades de computadores Windows em tempo real.

## 🚀 Funcionalidades

- ✅ **Monitoramento em Tempo Real** - Captura atividades instantaneamente
- ✅ **Dashboard Web** - Interface moderna e responsiva
- ✅ **Controle Remoto** - Bloquear, reiniciar e desligar computadores
- ✅ **Estatísticas** - Total de horas, dispositivos online/offline
- ✅ **Log de Atividades** - Histórico do que cada usuário está fazendo
- ✅ **Multiplataforma** - Servidor Node.js + Agente Python Windows

## 📋 Requisitos

### Servidor (Node.js)
- Node.js 16+
- NPM ou Yarn

### Agente (Windows)
- Python 3.7+
- Windows 7/10/11

## 🛠️ Instalação

### 1. Servidor Node.js

```bash
cd simple-monitor
npm install
npm start
```

O servidor estará rodando em: http://localhost:3000

### 2. Agente Python (Windows)

```bash
cd simple-monitor/agent
pip install -r requirements.txt
python monitor.py
```

Para conectar em servidor remoto:
```bash
python monitor.py ws://IP_DO_SERVIDOR:3000
```

## 📊 Dashboard

Acesse o dashboard em: http://localhost:3000

### Funcionalidades do Dashboard:
- **Estatísticas em Tempo Real**: Total de dispositivos, online/offline, horas de uso
- **Cards dos Computadores**: Informações detalhadas de cada PC
- **Controles Remotos**: Botões para bloquear, reiniciar e desligar
- **Log de Atividades**: Histórico das atividades de todos os computadores

## 🎮 Comandos Remotos

- **🔒 Bloquear**: Trava a tela do computador
- **🔄 Reiniciar**: Reinicia o computador
- **⚡ Desligar**: Desliga o computador

## 📱 Interface

O dashboard mostra em tempo real:
- Nome do computador e usuário
- Sistema operacional
- Status (online/offline)
- Atividade atual (navegando, programando, jogando, etc.)
- Janela ativa
- Tempo total de uso
- Última atividade

## 🔧 Configuração

### Alterar Porta do Servidor
Edite o arquivo `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Intervalo de Monitoramento
No arquivo `agent/monitor.py`:
```python
time.sleep(10)  # Alterar para o intervalo desejado
```

## 🖥️ Captura de Atividades

O agente detecta automaticamente:
- **Navegação**: Chrome, Firefox, Edge
- **Trabalho**: Word, Excel, PowerPoint
- **Programação**: VS Code, PyCharm, Sublime
- **Entretenimento**: YouTube, Netflix, Jogos
- **Sistema**: Explorer, configurações

## 🌐 Rede

Para usar em rede local:
1. Execute o servidor em um PC central
2. Configure os agentes com o IP do servidor:
   ```bash
   python monitor.py ws://192.168.1.100:3000
   ```

## 🔒 Segurança

- O sistema não coleta dados pessoais
- Apenas monitora janelas ativas e processos
- Comandos remotos requerem confirmação no dashboard

## 📋 Estrutura do Projeto

```
simple-monitor/
├── server.js              # Servidor Node.js
├── package.json           # Dependências Node.js
├── public/
│   └── dashboard.html     # Dashboard web
└── agent/
    ├── monitor.py         # Agente Python
    └── requirements.txt   # Dependências Python
```

## 🚨 Solução de Problemas

### Agente não conecta
- Verifique se o servidor está rodando
- Confirme o IP e porta
- Verifique firewall/antivírus

### Comandos remotos não funcionam
- Execute o agente como administrador
- Verifique permissões do Windows

### Dashboard não atualiza
- Verifique conexão WebSocket no console
- Recarregue a página

## 📈 Próximas Funcionalidades

- [ ] Relatórios em PDF
- [ ] Alertas por email
- [ ] Captura de screenshots
- [ ] Bloqueio de sites
- [ ] Agenda de tarefas

## 📞 Suporte

Para suporte e dúvidas, abra uma issue no repositório.
