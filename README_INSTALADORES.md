# WorkTrack - Instaladores para Windows

Este projeto inclui dois instaladores automáticos para Windows que configuram o WorkTrack Agent para rodar silenciosamente em segundo plano.

## 📋 Arquivos de Instalação

### 1. `install_worktrack.bat` (Instalador Completo)
**Características:**
- Instalação completa e robusta
- Detecta e instala Python automaticamente se necessário
- Configura como serviço do Windows
- Interface de configuração interativa
- Logs detalhados
- Opção de desinstalação
- Execução totalmente oculta do usuário

### 2. `setup_worktrack_simple.bat` (Instalador Simples)
**Características:**
- Instalação rápida e direta
- Requer Python pré-instalado ou usa winget
- Configuração básica
- Menor tamanho e complexidade
- Ideal para instalações rápidas

## 🚀 Como Usar

### Pré-requisitos
- Windows 7 ou superior
- Acesso de Administrador
- Conexão com internet (para baixar dependências)

### Instalação

1. **Baixe um dos arquivos .bat**
2. **Clique com botão direito** no arquivo
3. **Selecione "Executar como administrador"**
4. **Siga as instruções na tela**

### Configuração do Servidor

Durante a instalação, você pode configurar a URL do servidor:
```
Exemplos:
- http://192.168.1.100:8080 (servidor local)
- https://meuservidor.com (servidor externo)
- http://localhost:8080 (padrão)
```

## ⚙️ O que o instalador faz

1. **Verifica privilégios de administrador**
2. **Instala Python** (se necessário)
3. **Instala dependências Python:**
   - requests (comunicação HTTP)
   - psutil (informações do sistema)
   - pywin32 (API do Windows)
   - schedule (agendamento de tarefas)

4. **Cria diretórios:**
   - `C:\Program Files\WorkTrack\` (arquivos do programa)
   - `%APPDATA%\WorkTrack\` (configurações e logs)

5. **Configura inicialização automática:**
   - Adiciona entrada no Registro do Windows
   - Ou cria Tarefa Agendada (dependendo do instalador)

6. **Inicia o agente** (opcional)

## 📁 Estrutura após Instalação

```
C:\Program Files\WorkTrack\
├── worktrack_agent.py    # Agente principal
├── start_agent.bat       # Script de inicialização
└── agent.py             # Agente simplificado (versão simples)

%APPDATA%\WorkTrack\
├── config.json          # Configurações
└── worktrack.log        # Logs (versão completa)
```

## 🔧 Configuração Manual

Edite o arquivo `%APPDATA%\WorkTrack\config.json`:

```json
{
    "server_url": "http://seu-servidor:8080",
    "computer_name": "NOME-DO-PC",
    "heartbeat_interval": 30,
    "data_collection_interval": 60,
    "log_level": "INFO",
    "auto_start": true,
    "hide_window": true
}
```

## 🔍 Verificação e Monitoramento

### Verificar se está rodando:
1. Abra o **Gerenciador de Tarefas**
2. Procure por processo **python.exe**
3. Ou verifique logs em `%APPDATA%\WorkTrack\worktrack.log`

### Verificar inicialização automática:
1. Pressione `Win + R`
2. Digite `msconfig`
3. Aba **Inicialização** → procure por "WorkTrack"

## 🗑️ Desinstalação

### Método 1 - Automático (Instalador Completo):
```bat
install_worktrack.bat uninstall
```

### Método 2 - Manual:
1. **Parar o processo:**
   - Gerenciador de Tarefas → Finalizar python.exe (WorkTrack)

2. **Remover da inicialização:**
   ```cmd
   reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrack" /f
   ```

3. **Remover arquivos:**
   - Deletar `C:\Program Files\WorkTrack\`
   - Deletar `%APPDATA%\WorkTrack\`

4. **Remover tarefa agendada** (se existir):
   ```cmd
   schtasks /delete /tn "WorkTrack Agent" /f
   ```

## ⚠️ Solução de Problemas

### Erro: "Python não encontrado"
- Instale Python manualmente: https://python.org/downloads/
- Ou use: `winget install Python.Python.3.11`

### Erro: "Acesso negado"
- Execute como Administrador
- Desative temporariamente o antivírus

### Agente não inicia automaticamente:
- Verifique: `msconfig` → Inicialização
- Recriar entrada: `reg add "HKCU\...\Run" /v "WorkTrack" /d "caminho\start.bat"`

### Não envia dados para servidor:
- Verifique conectividade: `ping servidor`
- Conferir URL em `config.json`
- Verificar firewall/antivírus

## 📝 Logs e Debug

Os logs estão em: `%APPDATA%\WorkTrack\worktrack.log`

Para debug, execute manualmente:
```cmd
cd "C:\Program Files\WorkTrack"
python worktrack_agent.py
```

## 🔒 Segurança

- O agente roda com privilégios do usuário atual
- Comunica apenas com o servidor configurado
- Não coleta dados sensíveis (apenas nomes de aplicações)
- Logs locais não contêm informações pessoais

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs
2. Teste conexão com servidor
3. Execute instalador novamente
4. Contate o administrador do sistema
