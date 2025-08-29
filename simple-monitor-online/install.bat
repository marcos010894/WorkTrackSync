@echo off
title WorkTrack Monitor - Instalador Windows
color 0A

echo.
echo ========================================
echo  WorkTrack Monitor - Instalador Windows
echo ========================================
echo.

:: Verificar se Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado!
    echo.
    echo Por favor, instale Python 3.7+ em:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python encontrado
echo.

:: Criar diretorio de instalacao
set INSTALL_DIR=%USERPROFILE%\.worktrack_monitor
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
    echo [OK] Diretorio criado: %INSTALL_DIR%
) else (
    echo [OK] Diretorio ja existe: %INSTALL_DIR%
)

:: Instalar dependencias
echo [INFO] Instalando dependencias Python...
python -m pip install requests >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Erro ao instalar requests, tentando com --user
    python -m pip install --user requests >nul 2>&1
)
echo [OK] Dependencias instaladas

:: Criar script do monitor compacto
echo [INFO] Criando script do monitor...
(
echo import json,time,os,sys,subprocess,requests,platform,ctypes
echo from datetime import datetime
echo from ctypes import wintypes
echo class WindowsMonitor:
echo  def __init__^(self^):
echo   self.server_url="https://simple-monitor-online-kbgfqvu11-marcos10895s-projects.vercel.app"
echo   self.computer_id=f"{os.environ.get^('COMPUTERNAME','pc'^)}-{os.environ.get^('USERNAME','user'^)}".lower^(^)
echo   self.computer_name=os.environ.get^('COMPUTERNAME','Windows-PC'^)
echo   self.user_name=os.environ.get^('USERNAME','user'^)
echo   self.os_info=f"{platform.system^(^)} {platform.release^(^)}"
echo   self.total_minutes=0
echo   self.start_time=time.time^(^)
echo   self.log_file=os.path.join^(os.path.expanduser^("~"^),".worktrack_monitor","monitor.log"^)
echo  def log^(self,msg^):
echo   try:
echo    with open^(self.log_file,'a'^) as f:f.write^(f"[{datetime.now^(^)}] {msg}\n"^)
echo   except:pass
echo  def get_window^(self^):
echo   try:
echo    user32=ctypes.windll.user32;kernel32=ctypes.windll.kernel32
echo    hwnd=user32.GetForegroundWindow^(^)
echo    if not hwnd:return{'app':'Idle','title':''}
echo    pid=wintypes.DWORD^(^);user32.GetWindowThreadProcessId^(hwnd,ctypes.byref^(pid^)^)
echo    ph=kernel32.OpenProcess^(0x0400^|0x0010,False,pid^)
echo    if ph:
echo     fn=ctypes.create_unicode_buffer^(260^);kernel32.GetModuleFileNameExW^(ph,0,fn,260^);kernel32.CloseHandle^(ph^)
echo     app=os.path.basename^(fn.value^) if fn.value else "App"
echo    else:app="App"
echo    ln=user32.GetWindowTextLengthW^(hwnd^)
echo    if ln^>0:buf=ctypes.create_unicode_buffer^(ln+1^);user32.GetWindowTextW^(hwnd,buf,ln+1^);title=buf.value
echo    else:title=""
echo    return{'app':app,'title':title}
echo   except:return{'app':'Error','title':''}
echo  def register^(self^):
echo   try:
echo    data={'type':'register','computer_id':self.computer_id,'computer_name':self.computer_name,'user_name':self.user_name,'os_info':self.os_info}
echo    r=requests.post^(f'{self.server_url}/api/data',json=data,timeout=10^)
echo    if r.status_code==200:self.log^("Registered"^);return True
echo    else:self.log^(f"RegError:{r.status_code}"^);return False
echo   except Exception as e:self.log^(f"RegEx:{e}"^);return False
echo  def send^(self,data^):
echo   try:
echo    r=requests.post^(f'{self.server_url}/api/data',json=data,timeout=10^)
echo    return r.status_code==200
echo   except:return False
echo  def run^(self^):
echo   self.log^("Started"^);self.register^(^);last_win=None
echo   while True:
echo    try:
echo     win=self.get_window^(^);self.total_minutes=int^(^(time.time^(^)-self.start_time^)/60^)
echo     if win!=last_win:
echo      act=f"Using {win['app']}"
echo      if win['title']:act+=f" - {win['title'][:50]}"
echo      data={'type':'activity','computer_id':self.computer_id,'computer_name':self.computer_name,'user_name':self.user_name,'os_info':self.os_info,'activity':act,'window':win['title'][:100],'total_minutes':self.total_minutes,'timestamp':datetime.now^(^).isoformat^(^)}
echo      if self.send^(data^):self.log^(f"Sent:{act}"^)
echo      last_win=win
echo     time.sleep^(10^)
echo    except KeyboardInterrupt:break
echo    except Exception as e:self.log^(f"Error:{e}"^);time.sleep^(30^)
echo if __name__=="__main__":WindowsMonitor^(^).run^(^)
) > "%INSTALL_DIR%\monitor.py"

echo [OK] Script do monitor criado

:: Adicionar ao registro para autostart
echo [INFO] Configurando inicializacao automatica...
set SCRIPT_PATH=%INSTALL_DIR%\monitor.py

:: Adicionar ao registro
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorkTrackMonitor" /t REG_SZ /d "python \"%SCRIPT_PATH%\"" /f >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Erro ao configurar autostart
) else (
    echo [OK] Autostart configurado
)

:: Tornar diretorio oculto
attrib +h "%INSTALL_DIR%" >nul 2>&1

:: Iniciar monitor em background
echo [INFO] Iniciando monitor em background...
start /min python "%INSTALL_DIR%\monitor.py"
echo [OK] Monitor iniciado

echo.
echo ========================================
echo       INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo [OK] Monitor instalado com sucesso
echo [OK] Funcionando em background
echo [OK] Completamente invisivel
echo [OK] Iniciara automaticamente no boot
echo.
echo Arquivos: %INSTALL_DIR%
echo Logs: %INSTALL_DIR%\monitor.log
echo.
echo Para DESINSTALAR, execute: uninstall.bat
echo.
echo Pressione qualquer tecla para sair...
pause >nul
