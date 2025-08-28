# 🖥️ WorkTrackSync

O **WorkTrackSync** é um sistema para monitoramento de tempo de uso de computadores em ambientes corporativos, auxiliando gestores a acompanhar a produtividade de equipes em **home office** ou **ambiente presencial**.  

Ele é dividido em **dois módulos principais**:

- **Agente local (instalador Python)** → roda diretamente na máquina do funcionário, monitorando em tempo real ou a cada 5 minutos a atividade do usuário (programas abertos e tempo total de uso).
- **Painel administrativo (Web)** → desenvolvido em **PHP, HTML e JavaScript**, moderno e responsivo, que permite ao administrador visualizar e gerenciar todos os dispositivos conectados.

---

## 🚀 Funcionalidades

### 🔹 Agente Python (Instalável no PC do colaborador)
- Monitora o **tempo diário de uso do computador**.  
- Registra quais **programas estão abertos** em tempo real ou com intervalo configurado (ex: a cada 5 minutos).  
- Comunicação com o servidor para enviar dados em tempo real.  
- Recebe comandos do administrador, como **travar o computador** remotamente.

---

### 🔹 Painel Web (Administração)
- **Dashboard moderno e elegante** com estatísticas globais:
  - Tempo total de uso de todos os computadores.  
  - Número de **computadores conectados atualmente**.  
  - Total de **computadores offline**.  
  - Total de **dispositivos cadastrados**.  
- Filtros avançados:
  - Visualização de tempo por **usuário/computador**.  
  - Agrupamento de dados por período (diário, semanal, mensal).  
- Função de **bloqueio remoto de máquina**.  
- Interface em **tempo real** com atualização dinâmica (AJAX/WebSocket).  

---

## 🛠️ Tecnologias

### Agente Python
- Python 3.x  
- Bibliotecas:  
  - `psutil` (monitoramento de processos e tempo de uso)  
  - `requests` ou `websockets` (comunicação com o servidor)  
  - `pyinstaller` (gerar instalador executável para Windows/Linux)  

### Painel Web
- **Back-end**: PHP 8+  
- **Front-end**: HTML5, CSS3, JavaScript (ES6+)  
- **Design**: TailwindCSS ou Bootstrap + componentes customizados  
- **Banco de dados**: MySQL/MariaDB  

---

## 📊 Fluxo de Funcionamento

1. O **Agente Python** inicia junto com o sistema operacional.  
2. A cada intervalo definido (ou em tempo real), envia dados de:
   - Programas em execução.  
   - Tempo acumulado de uso diário.  
   - Status online/offline.  
3. O **Servidor Web** recebe, processa e armazena essas informações.  
4. O **Administrador** acessa o **Dashboard** e acompanha métricas em tempo real.  
5. Caso necessário, envia comando para **travar remotamente** um computador.  
6. O Agente Python recebe o comando e executa a ação.  

---

## 🔐 Segurança
- Comunicação segura entre Agente e Servidor (HTTPS + token de autenticação).  
- Criptografia básica para dados sensíveis.  
- Controle de acesso para administradores via login seguro (PHP Sessions/JWT).  

---

## 📅 Próximos Passos do Desenvolvimento
- [ ] Criar protótipo do **Agente Python** para captura de programas ativos.  
- [ ] Configurar API em PHP para receber os dados.  
- [ ] Estruturar o **banco de dados** (usuários, computadores, logs de atividades).  
- [ ] Desenvolver **Dashboard Web** responsivo com gráficos e tabelas.  
- [ ] Implementar função de **bloqueio remoto** no agente.  
- [ ] Testes de desempenho e otimização.  

---

## 📌 Objetivo Final
Oferecer uma solução confiável e moderna para **gestão do tempo de trabalho** em computadores, permitindo que empresas acompanhem **produtividade, presença e uso de recursos** em tempo real.  

---
