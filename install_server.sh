#!/bin/bash

# WorkTrackSync - Script de instalação automática para Linux

echo "🚀 WorkTrackSync - Instalação Automática"
echo "========================================"

# Verificar se é executado como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Execute como root (sudo)"
    exit 1
fi

# Detectar distribuição
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
    PKG_MANAGER="apt"
elif [ -f /etc/redhat-release ]; then
    DISTRO="redhat"
    PKG_MANAGER="yum"
else
    echo "❌ Distribuição não suportada"
    exit 1
fi

echo "✅ Distribuição detectada: $DISTRO"

# Atualizar repositórios
echo "📦 Atualizando repositórios..."
if [ "$PKG_MANAGER" = "apt" ]; then
    apt update
else
    yum update -y
fi

# Instalar dependências
echo "📦 Instalando dependências..."
if [ "$PKG_MANAGER" = "apt" ]; then
    apt install -y apache2 mysql-server php php-mysql php-json php-mbstring python3 python3-pip
else
    yum install -y httpd mariadb-server php php-mysql php-json php-mbstring python3 python3-pip
fi

# Configurar Apache
echo "🌐 Configurando Apache..."
if [ "$PKG_MANAGER" = "apt" ]; then
    systemctl enable apache2
    systemctl start apache2
else
    systemctl enable httpd
    systemctl start httpd
fi

# Configurar MySQL
echo "🗄️ Configurando MySQL..."
if [ "$PKG_MANAGER" = "apt" ]; then
    systemctl enable mysql
    systemctl start mysql
else
    systemctl enable mariadb
    systemctl start mariadb
fi

# Criar banco de dados
echo "🗄️ Criando banco de dados..."
mysql -e "CREATE DATABASE IF NOT EXISTS worktrack_sync;"
mysql -e "CREATE USER IF NOT EXISTS 'worktrack'@'localhost' IDENTIFIED BY 'worktrack123';"
mysql -e "GRANT ALL PRIVILEGES ON worktrack_sync.* TO 'worktrack'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Copiar arquivos web
echo "📁 Copiando arquivos web..."
cp -r web/ /var/www/html/worktrack/
chown -R www-data:www-data /var/www/html/worktrack/ 2>/dev/null || chown -R apache:apache /var/www/html/worktrack/
chmod -R 755 /var/www/html/worktrack/

# Importar schema
echo "🗄️ Importando schema do banco..."
mysql worktrack_sync < database/schema.sql

# Instalar dependências Python
echo "🐍 Instalando dependências Python..."
pip3 install -r agent/requirements.txt

# Configurar cron job
echo "⏰ Configurando cron job..."
echo "* * * * * php /var/www/html/worktrack/cron_status_update.php" | crontab -

# Configurar firewall
echo "🔥 Configurando firewall..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 80/tcp
    ufw allow 443/tcp
elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

echo ""
echo "🎉 Instalação concluída!"
echo "========================================"
echo "📍 Painel Web: http://$(hostname -I | awk '{print $1}')/worktrack/"
echo "👤 Login: admin"
echo "🔑 Senha: admin123"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Altere a senha padrão imediatamente"
echo "2. Configure HTTPS para produção"
echo "3. Ajuste as configurações do banco em /var/www/html/worktrack/includes/config.php"
echo ""
echo "📚 Para instalar o agente em computadores:"
echo "   cd agent/ && python3 installer.py"
