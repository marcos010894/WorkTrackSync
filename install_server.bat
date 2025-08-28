@echo off
REM WorkTrackSync - Script de instalação para Windows Server

echo 🚀 WorkTrackSync - Instalação Windows
echo =====================================

REM Verificar se está executando como administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Executando como administrador
) else (
    echo ❌ Execute como administrador
    pause
    exit /b 1
)

REM Verificar se o XAMPP está instalado
if exist "C:\xampp\xampp-control.exe" (
    echo ✅ XAMPP encontrado
) else (
    echo ❌ XAMPP não encontrado
    echo 📥 Baixe e instale o XAMPP: https://www.apachefriends.org/
    pause
    exit /b 1
)

REM Verificar se o Python está instalado
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Python encontrado
) else (
    echo ❌ Python não encontrado
    echo 📥 Baixe e instale o Python: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo 📦 Copiando arquivos...

REM Copiar arquivos web para XAMPP
if exist "C:\xampp\htdocs\worktrack\" (
    rmdir /s /q "C:\xampp\htdocs\worktrack\"
)
xcopy /s /e /i "web" "C:\xampp\htdocs\worktrack\"

echo ✅ Arquivos copiados para C:\xampp\htdocs\worktrack\

echo.
echo 🗄️ Configurando banco de dados...
echo IMPORTANTE: 
echo 1. Inicie o XAMPP Control Panel
echo 2. Inicie Apache e MySQL
echo 3. Acesse http://localhost/phpmyadmin/
echo 4. Crie um banco chamado 'worktrack_sync'
echo 5. Importe o arquivo 'database\schema.sql'

echo.
echo 🐍 Instalando dependências Python...
cd agent
pip install -r requirements.txt

echo.
echo 🎉 Instalação do servidor concluída!
echo =====================================
echo 📍 Painel Web: http://localhost/worktrack/
echo 👤 Login: admin
echo 🔑 Senha: admin123
echo.
echo ⚠️  PRÓXIMOS PASSOS:
echo 1. Configure o banco de dados conforme instruções acima
echo 2. Altere a senha padrão imediatamente
echo 3. Para instalar o agente: execute 'python installer.py' na pasta agent\
echo.
pause
