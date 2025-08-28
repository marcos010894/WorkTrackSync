# 🖥️ WorkTrackSync

**Sistema completo de monitoramento de tempo e atividades para computadores corporativos**

O WorkTrackSync é uma solução moderna e eficiente para acompanhar a produtividade de equipes em **home office** ou **ambiente presencial**, oferecendo monitoramento em tempo real e ferramentas administrativas avançadas.

---

## 🚀 Características Principais

### 🔹 Agente Python (Cliente)
- ✅ Monitora tempo de uso diário do computador
- ✅ Registra programas em execução em tempo real
- ✅ Detecta janelas ativas e aplicações utilizadas
- ✅ Comunicação segura com servidor via HTTPS
- ✅ Recebe e executa comandos remotos
- ✅ Instalação automática e inicialização com o sistema
- ✅ Suporte multiplataforma (Windows, macOS, Linux)

### 🔹 Painel Web Administrativo
- ✅ Dashboard moderno e responsivo
- ✅ Estatísticas em tempo real
- ✅ Gráficos e relatórios visuais
- ✅ Gerenciamento de computadores
- ✅ Envio de comandos remotos
- ✅ Sistema de autenticação seguro
- ✅ Interface intuitiva e elegante

---

## 📊 Funcionalidades Detalhadas

### Monitoramento
- **Tempo de uso diário** com precisão de minutos
- **Programas em execução** com detalhes completos
- **Janelas ativas** e títulos de aplicações
- **Status online/offline** em tempo real
- **Histórico de atividades** com logs detalhados

### Administração
- **Dashboard centralizado** com métricas globais
- **Controle remoto** de computadores
- **Bloqueio de tela** remotamente
- **Envio de mensagens** para usuários
- **Reinicialização/desligamento** remoto
- **Relatórios personalizáveis** por período

### Segurança
- **Comunicação criptografada** HTTPS
- **Autenticação robusta** para administradores
- **Logs de auditoria** de todas as ações
- **Controle de acesso** granular
- **Proteção contra ataques** comuns

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.7+** (Agente cliente)
- **PHP 8+** (API e painel web)
- **MySQL/MariaDB** (Banco de dados)

### Frontend
- **HTML5, CSS3, JavaScript ES6+**
- **TailwindCSS** (Framework CSS)
- **Chart.js** (Gráficos interativos)
- **Font Awesome** (Ícones)

### Bibliotecas Python
- `psutil` - Monitoramento de processos
- `requests` - Comunicação HTTP
- `pyinstaller` - Geração de executável

---

## 📦 Instalação

### 1. Configuração do Servidor Web

```bash
# Clone o repositório
git clone <repository-url> worktrack-sync
cd worktrack-sync

# Configure o servidor web (Apache/Nginx) para apontar para a pasta web/
# Exemplo para Apache:
sudo cp -r web/ /var/www/html/worktrack/

# Configure as permissões
sudo chown -R www-data:www-data /var/www/html/worktrack/
sudo chmod -R 755 /var/www/html/worktrack/
```

### 2. Configuração do Banco de Dados

```bash
# Importe o schema do banco
mysql -u root -p < database/schema.sql

# Ou crie manualmente:
mysql -u root -p
CREATE DATABASE worktrack_sync;
USE worktrack_sync;
source database/schema.sql;
```

### 3. Configuração do PHP

Edite `web/includes/config.php` com suas credenciais de banco:

```php
private $host = 'localhost';
private $dbname = 'worktrack_sync';
private $username = 'seu_usuario';
private $password = 'sua_senha';
```

### 4. Instalação do Agente Python

```bash
cd agent/

# Instalar dependências
pip install -r requirements.txt

# Executar instalador
python installer.py
```

### 5. Configuração do Agente

Durante a instalação, configure:
- **URL do servidor**: `http://seu-servidor.com/worktrack/api`
- **Intervalo de monitoramento**: 300 segundos (5 minutos)
- **Comandos remotos**: Habilitado

---

## 🎯 Uso

### Acesso ao Painel Administrativo

1. Acesse: `http://seu-servidor.com/worktrack/`
2. **Login padrão:**
   - Usuário: `admin`
   - Senha: `admin123`

### Dashboard Principal

O dashboard oferece:
- **Estatísticas gerais** (computadores online/offline)
- **Tempo total de uso** diário
- **Gráficos de atividade** por período
- **Lista de atividades recentes**

### Gerenciamento de Computadores

- **Visualização em tempo real** do status
- **Envio de comandos remotos**:
  - Bloquear tela
  - Enviar mensagem
  - Reiniciar sistema
  - Desligar sistema
- **Histórico de atividades** por computador

### Agente Python

O agente é executado automaticamente e:
- **Inicia com o sistema** operacional
- **Monitora continuamente** as atividades
- **Envia dados** a cada 5 minutos
- **Recebe comandos** do servidor
- **Executa ações** remotas quando solicitado

---

## ⚙️ Configuração Avançada

### Cron Jobs (Recomendado)

Configure um cron job para manter o status atualizado:

```bash
# Adicione ao crontab
* * * * * php /var/www/html/worktrack/cron_status_update.php
```

### Configurações do Sistema

Acesse **Configurações** no painel para ajustar:
- Intervalo de monitoramento
- Tempo para marcar offline
- Retenção de dados históricos
- Configurações de segurança

### HTTPS (Recomendado)

Para ambiente de produção, configure HTTPS:

```bash
# Exemplo com Let's Encrypt
sudo certbot --apache -d seu-dominio.com
```

---

## 🔧 Personalização

### Modificar Intervalos

**Agente Python** (`agent/config.json`):
```json
{
    "monitoring_interval": 300,
    "heartbeat_interval": 60
}
```

**Servidor Web** (banco de dados):
```sql
UPDATE system_settings 
SET setting_value = '180' 
WHERE setting_key = 'monitoring_interval';
```

### Adicionar Comandos Remotos

1. Edite `agent/worktrack_agent.py`
2. Adicione novo comando em `execute_remote_command()`
3. Atualize `web/api/commands.php`
4. Modifique interface em `web/assets/js/dashboard.js`

---

## 📈 Monitoramento e Logs

### Logs do Sistema

- **Agente**: `agent/worktrack_agent.log`
- **Servidor**: `web/logs/worktrack.log`
- **Banco**: Tabela `activity_logs`

### Métricas Importantes

- **Uptime dos computadores**
- **Tempo médio de uso diário**
- **Programas mais utilizados**
- **Horários de maior atividade**

---

## 🛡️ Segurança

### Práticas Implementadas

- ✅ **Comunicação HTTPS** obrigatória
- ✅ **Hashing de senhas** com bcrypt
- ✅ **Validação de dados** em todas as APIs
- ✅ **Sanitização de inputs** contra XSS
- ✅ **Prepared statements** contra SQL Injection
- ✅ **Headers de segurança** configurados
- ✅ **Logs de auditoria** completos

### Recomendações Adicionais

1. **Altere credenciais padrão** imediatamente
2. **Configure firewall** para restringir acesso
3. **Use HTTPS** em produção
4. **Monitore logs** regularmente
5. **Faça backups** periódicos do banco

---

## 🚨 Troubleshooting

### Problemas Comuns

#### Agente não conecta
```bash
# Verificar conectividade
curl -X GET http://seu-servidor.com/worktrack/api/ping.php

# Verificar logs
tail -f agent/worktrack_agent.log
```

#### Computadores aparecem offline
```bash
# Verificar cron job
sudo crontab -l

# Executar manualmente
php web/cron_status_update.php
```

#### Erro de banco de dados
```bash
# Verificar conexão
mysql -u usuario -p worktrack_sync

# Verificar logs do PHP
tail -f /var/log/apache2/error.log
```

---

## 📝 Desenvolvimento

### Estrutura do Projeto

```
worktrack-sync/
├── agent/                  # Agente Python
│   ├── worktrack_agent.py  # Código principal
│   ├── installer.py        # Instalador
│   ├── config.json         # Configurações
│   └── requirements.txt    # Dependências
├── web/                    # Painel Web
│   ├── api/               # APIs REST
│   ├── assets/            # CSS/JS/Imagens
│   ├── includes/          # Configurações PHP
│   ├── dashboard.php      # Dashboard principal
│   └── login.php          # Página de login
├── database/              # Scripts SQL
│   └── schema.sql         # Schema do banco
└── README.md             # Este arquivo
```

### Contribuindo

1. **Fork** o projeto
2. **Crie** uma branch para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra** um Pull Request

---

## 📋 Roadmap

### Versão 1.1 (Próxima)
- [ ] Relatórios em PDF
- [ ] Notificações por email
- [ ] API REST completa
- [ ] Aplicativo mobile
- [ ] Múltiplos administradores

### Versão 1.2 (Futura)
- [ ] Machine Learning para detecção de padrões
- [ ] Integração com Active Directory
- [ ] Dashboards personalizáveis
- [ ] Alertas automáticos
- [ ] Backup automático

---

## 📞 Suporte

### Documentação
- **Wiki**: [Em desenvolvimento]
- **FAQ**: [Em desenvolvimento]
- **Video Tutoriais**: [Em desenvolvimento]

### Contato
- **Issues**: Use o sistema de issues do GitHub
- **Email**: [Seu email de suporte]
- **Discord**: [Seu servidor Discord]

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## ⭐ Agradecimentos

Obrigado por usar o WorkTrackSync! Se este projeto foi útil para você:

- ⭐ **Dê uma estrela** no GitHub
- 🔄 **Compartilhe** com colegas
- 🐛 **Reporte bugs** encontrados
- 💡 **Sugira melhorias**

---

**WorkTrackSync** - *Monitoramento inteligente para equipes produtivas*
