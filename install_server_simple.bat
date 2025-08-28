@echo off
REM WorkTrackSync - Instalador Simples do Servidor
cls

echo ==========================================
echo   WorkTrack Server - Instalação Rápida
echo ==========================================
echo.

REM Verificar admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Execute como Administrador!
    pause
    exit /b 1
)

echo ✅ Instalador iniciado com privilégios de admin
echo.

REM Verificar XAMPP
if not exist "C:\xampp\xampp-control.exe" (
    echo ❌ XAMPP não encontrado!
    echo.
    echo 📥 BAIXE E INSTALE O XAMPP:
    echo    https://www.apachefriends.org/download.html
    echo.
    echo    Após instalar o XAMPP, execute este script novamente.
    pause
    exit /b 1
)

echo ✅ XAMPP encontrado

REM Verificar Python
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Python não encontrado!
    echo.
    echo 📥 BAIXE E INSTALE O PYTHON:
    echo    https://www.python.org/downloads/
    echo.
    echo    Após instalar o Python, execute este script novamente.
    pause
    exit /b 1
)

echo ✅ Python encontrado

REM Copiar arquivos
echo.
echo 📂 Copiando arquivos do sistema...

if exist "C:\xampp\htdocs\worktrack" (
    echo 🔄 Removendo instalação anterior...
    rmdir /s /q "C:\xampp\htdocs\worktrack"
)

xcopy /s /e /i /q "web" "C:\xampp\htdocs\worktrack\"
if %errorLevel% neq 0 (
    echo ❌ Erro ao copiar arquivos!
    pause
    exit /b 1
)

echo ✅ Arquivos copiados para C:\xampp\htdocs\worktrack\

REM Instalar dependências Python
echo.
echo 🐍 Instalando dependências Python...
pip install requests mysql-connector-python >nul 2>&1

echo.
echo ==========================================
echo   🎉 INSTALAÇÃO BÁSICA CONCLUÍDA!
echo ==========================================
echo.
echo 📍 Local dos arquivos: C:\xampp\htdocs\worktrack\
echo.
echo ⚠️  AGORA VOCÊ PRECISA:
echo ==========================================
echo.
echo 1. 🚀 INICIAR XAMPP:
echo    - Abra: C:\xampp\xampp-control.exe
echo    - Inicie: Apache e MySQL
echo.
echo 2. 🗄️  CONFIGURAR BANCO DE DADOS:
echo    - Acesse: http://localhost/phpmyadmin/
echo    - Crie banco: worktrack_sync
echo    - Importe: database\schema.sql
echo.
echo 3. 🔐 CONFIGURAR SISTEMA:
echo    - Acesse: http://localhost/worktrack/
echo    - Login: admin / Senha: admin123
echo    - ALTERE A SENHA imediatamente!
echo.
echo 4. 💻 INSTALAR AGENTES:
echo    - Use: install_worktrack.bat (nos computadores cliente)
echo    - Configure IP deste servidor nos agentes
echo.
echo ==========================================

set /p "OPEN_XAMPP=Abrir XAMPP Control Panel agora? (S/N): "
if /i "%OPEN_XAMPP%"=="S" (
    start "" "C:\xampp\xampp-control.exe"
)

set /p "OPEN_PHPMYADMIN=Abrir phpMyAdmin para configurar banco? (S/N): "
if /i "%OPEN_PHPMYADMIN%"=="S" (
    start http://localhost/phpmyadmin/
)

echo.
echo 📞 SUPORTE:
echo    - Manual completo: GUIA_INSTALACAO.md
echo    - Problemas? Verifique logs em C:\xampp\apache\logs\
echo.
pause
