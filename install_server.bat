@echo off
REM WorkTrackSync - Instalador Completo do Servidor Windows
setlocal enabledelayedexpansion

cls
echo.
echo ========================================
echo   �️  WorkTrackSync Server - Instalador
echo ========================================
echo.

REM Verificar privilégios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERRO: Execute como administrador!
    echo.
    echo 📋 Como executar:
    echo    1. Clique direito neste arquivo
    echo    2. Selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo ✅ Privilégios de administrador verificados
echo.

REM Verificar conexão com internet
echo 🌐 Verificando conexão com internet...
ping google.com -n 1 >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Sem conexão com internet - necessária para download de dependências
    pause
    exit /b 1
)
echo ✅ Conexão com internet OK

REM Instalar Chocolatey se não existir
echo.
echo 📦 Verificando gerenciador de pacotes...
where choco >nul 2>&1
if %errorLevel% neq 0 (
    echo 📥 Instalando Chocolatey...
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
    if %errorLevel% neq 0 (
        echo ❌ Falha ao instalar Chocolatey
        goto manual_install
    )
    echo ✅ Chocolatey instalado
) else (
    echo ✅ Chocolatey já instalado
)

REM Atualizar PATH
call refreshenv >nul 2>&1

REM Instalar XAMPP
echo.
echo 🔧 Verificando XAMPP...
if exist "C:\xampp\xampp-control.exe" (
    echo ✅ XAMPP já instalado
) else (
    echo 📥 Instalando XAMPP...
    choco install xampp-81 -y
    if %errorLevel% neq 0 (
        echo ❌ Falha ao instalar XAMPP automaticamente
        goto manual_install
    )
    echo ✅ XAMPP instalado
)

REM Instalar Python
echo.
echo 🐍 Verificando Python...
python --version >nul 2>&1
if %errorLevel% eq 0 (
    echo ✅ Python já instalado
) else (
    echo 📥 Instalando Python...
    choco install python -y
    if %errorLevel% neq 0 (
        echo ❌ Falha ao instalar Python automaticamente
        goto manual_install
    )
    echo ✅ Python instalado
    call refreshenv
)

REM Instalar MySQL Connector
echo.
echo 🔌 Verificando MySQL Connector...
python -c "import mysql.connector" >nul 2>&1
if %errorLevel% eq 0 (
    echo ✅ MySQL Connector já instalado
) else (
    echo 📥 Instalando MySQL Connector...
    pip install mysql-connector-python
)

goto continue_install

:manual_install
echo.
echo ⚠️  INSTALAÇÃO MANUAL NECESSÁRIA
echo ================================
echo.
echo Por favor, instale manualmente:
echo.
echo 1. 📥 XAMPP (PHP + MySQL + Apache):
echo    https://www.apachefriends.org/download.html
echo.
echo 2. 🐍 Python 3.8+:
echo    https://www.python.org/downloads/
echo.
echo 3. Execute este script novamente após as instalações
echo.
pause
exit /b 1

:continue_install
echo.
echo ========================================
echo   � CONFIGURANDO ARQUIVOS
echo ========================================

REM Definir diretórios
set "XAMPP_DIR=C:\xampp"
set "WEB_DIR=%XAMPP_DIR%\htdocs\worktrack"
set "MYSQL_DIR=%XAMPP_DIR%\mysql\bin"
set "PHP_DIR=%XAMPP_DIR%\php"

REM Criar backup se já existir
if exist "%WEB_DIR%" (
    echo 🔄 Criando backup da instalação anterior...
    move "%WEB_DIR%" "%WEB_DIR%_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%" >nul 2>&1
)

REM Copiar arquivos web
echo 📂 Copiando arquivos web...
xcopy /s /e /i "web" "%WEB_DIR%" >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Erro ao copiar arquivos web
    pause
    exit /b 1
)
echo ✅ Arquivos web copiados para %WEB_DIR%

REM Iniciar serviços XAMPP
echo.
echo 🚀 Iniciando serviços...
echo 📝 Iniciando Apache...
net start Apache2.4 >nul 2>&1
"%XAMPP_DIR%\apache_start.bat" >nul 2>&1

echo 📝 Iniciando MySQL...
net start mysql >nul 2>&1
"%XAMPP_DIR%\mysql_start.bat" >nul 2>&1

REM Aguardar serviços iniciarem
timeout /t 5 /nobreak >nul

REM Configurar banco de dados
echo.
echo ========================================
echo   🗄️  CONFIGURANDO BANCO DE DADOS
echo ========================================

REM Tentar configurar banco automaticamente
echo 🔧 Configurando banco de dados...

REM Criar banco e usuário
echo CREATE DATABASE IF NOT EXISTS worktrack_sync; > temp_db_setup.sql
echo CREATE USER IF NOT EXISTS 'worktrack_user'@'localhost' IDENTIFIED BY 'worktrack_pass_2024'; >> temp_db_setup.sql
echo GRANT ALL PRIVILEGES ON worktrack_sync.* TO 'worktrack_user'@'localhost'; >> temp_db_setup.sql
echo FLUSH PRIVILEGES; >> temp_db_setup.sql

"%MYSQL_DIR%\mysql.exe" -u root -e "source temp_db_setup.sql" >nul 2>&1
if %errorLevel% eq 0 (
    echo ✅ Banco de dados configurado
    
    REM Importar schema
    echo 📥 Importando estrutura do banco...
    "%MYSQL_DIR%\mysql.exe" -u worktrack_user -pworktrack_pass_2024 worktrack_sync < database\schema.sql >nul 2>&1
    if %errorLevel% eq 0 (
        echo ✅ Estrutura do banco importada
    ) else (
        echo ⚠️  Erro ao importar estrutura - configure manualmente
    )
) else (
    echo ⚠️  Configuração automática falhou - será necessário configurar manualmente
)

del temp_db_setup.sql >nul 2>&1

REM Configurar arquivo de configuração PHP
echo 🔧 Configurando conexão com banco...
set "CONFIG_FILE=%WEB_DIR%\includes\config.php"
if exist "%CONFIG_FILE%" (
    echo ✅ Arquivo de configuração encontrado
) else (
    echo ❌ Arquivo de configuração não encontrado
)

echo.
echo ========================================
echo   🎉 INSTALAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo 📍 Painel Administrativo: http://localhost/worktrack/
echo 👤 Login padrão: admin
echo 🔑 Senha padrão: admin123
echo.
echo 🔧 Configurações:
echo    - Banco: worktrack_sync
echo    - Usuário DB: worktrack_user  
echo    - Senha DB: worktrack_pass_2024
echo    - Arquivos: %WEB_DIR%
echo.
echo ⚠️  IMPORTANTE - PRÓXIMOS PASSOS:
echo ================================
echo.
echo 1. 🌐 Teste o acesso: http://localhost/worktrack/
echo.
echo 2. 🔐 ALTERE A SENHA PADRÃO imediatamente no dashboard
echo.
echo 3. 🖥️  Para instalar agentes nos computadores:
echo    - Execute: install_worktrack.bat (como admin)
echo    - Configure o IP deste servidor
echo.
echo 4. 🔥 Configure o Firewall:
echo    - Libere porta 80 (HTTP)
echo    - Libere porta 3306 (MySQL) se necessário
echo.
echo 5. 📱 Para acesso externo:
echo    - Configure IP fixo neste computador
echo    - Configure roteador (port forwarding)
echo.
set /p "OPEN_BROWSER=Deseja abrir o painel web agora? (S/N): "
if /i "!OPEN_BROWSER!"=="S" (
    start http://localhost/worktrack/
)

echo.
echo 📞 Suporte:
echo    - Logs Apache: %XAMPP_DIR%\apache\logs\error.log
echo    - Logs MySQL: %XAMPP_DIR%\mysql\data\*.err
echo    - Painel XAMPP: %XAMPP_DIR%\xampp-control.exe
echo.
echo Pressione qualquer tecla para finalizar...
pause >nul
