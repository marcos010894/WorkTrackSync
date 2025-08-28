# 🚀 WorkTrackSync - Instalação Rápida

## 📋 Resumo de Instalação

### Para SERVIDOR (1 vez apenas):

#### Windows:
1. **Download dos arquivos do sistema**
2. **Execute como Administrador:** `install_server.bat` OU `install_server_simple.bat`
3. **Configure banco de dados** (seguir instruções na tela)
4. **Teste:** Acesse `http://localhost/worktrack/` (Login: admin / Senha: admin123)

#### Linux/macOS:
```bash
sudo ./install_server.sh
```

---

### Para COMPUTADORES CLIENTE (cada um):

#### Windows:
1. **Execute como Administrador:** `install_worktrack.bat`
2. **Configure IP do servidor** quando solicitado
3. **Pronto!** O agente ficará invisível e rodará automaticamente

#### Outras plataformas:
- Consulte `GUIA_INSTALACAO.md` para instruções detalhadas

---

## 🔧 Configuração Mínima

### Servidor precisa de:
- ✅ Windows/Linux/macOS
- ✅ PHP 8.0+  
- ✅ MySQL 5.7+
- ✅ Conexão internet (para downloads)

### Computadores cliente precisam de:
- ✅ Windows 7+ (recomendado)
- ✅ Python 3.8+ (instalado automaticamente)
- ✅ Conexão de rede com servidor

---

## 📱 Acesso após Instalação

### Dashboard Web:
- **Local:** `http://localhost/worktrack/`
- **Rede:** `http://IP_DO_SERVIDOR/worktrack/`
- **Login:** admin
- **Senha:** admin123 ⚠️ **ALTERE IMEDIATAMENTE**

### Verificar Computadores:
1. Login no dashboard
2. Menu "Computadores"
3. Verificar status "Online"

---

## ⚡ Resolução Rápida de Problemas

### Servidor não carrega:
```bash
# Verificar se Apache está rodando
# Windows: Abrir XAMPP Control Panel
# Linux: sudo systemctl status apache2
```

### Agente não conecta:
```bash
# Testar conectividade
ping IP_DO_SERVIDOR

# Verificar firewall
# Liberar porta 80 no servidor
```

### Computador não aparece no dashboard:
- Aguardar 1-2 minutos
- Verificar se agente está rodando
- Conferir IP do servidor no agente

---

## 📞 Suporte Completo

Para instruções detalhadas, consulte:
- **`GUIA_INSTALACAO.md`** - Manual completo
- **`README_INSTALADORES.md`** - Guia dos instaladores Windows

---

## 🎯 Instalação em 3 Passos

### 1️⃣ Servidor (Administrador):
```bash
# Download do sistema → Execute install_server.bat → Configure banco
```

### 2️⃣ Agentes (Cada PC):
```bash  
# Execute install_worktrack.bat → Informe IP do servidor → Pronto!
```

### 3️⃣ Verificação:
```bash
# Acesse dashboard → Verifique computadores online → Sistema funcionando!
```

**Total: ~10 minutos para instalação completa** ⏱️
