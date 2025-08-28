#!/usr/bin/env python3
"""
Instalador do WorkTrack Agent
"""

import os
import sys
import json
import shutil
import platform
import subprocess
from pathlib import Path

class AgentInstaller:
    def __init__(self):
        self.system = platform.system()
        self.install_dir = self.get_install_directory()
        
    def get_install_directory(self) -> str:
        """Retorna diretório de instalação baseado no SO"""
        if self.system == "Windows":
            return os.path.join(os.environ.get('PROGRAMFILES', 'C:\\Program Files'), 'WorkTrackSync')
        elif self.system == "Darwin":  # macOS
            return "/Applications/WorkTrackSync"
        else:  # Linux
            return "/opt/worktrack"
    
    def check_requirements(self) -> bool:
        """Verifica se os requisitos estão atendidos"""
        try:
            # Verificar Python
            python_version = sys.version_info
            if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 7):
                print("❌ Python 3.7+ é necessário")
                return False
            
            print(f"✅ Python {python_version.major}.{python_version.minor} encontrado")
            
            # Verificar dependências
            required_packages = ['requests', 'psutil']
            
            for package in required_packages:
                try:
                    __import__(package)
                    print(f"✅ {package} encontrado")
                except ImportError:
                    print(f"❌ {package} não encontrado - instalando...")
                    subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                    print(f"✅ {package} instalado")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao verificar requisitos: {e}")
            return False
    
    def create_install_directory(self) -> bool:
        """Cria diretório de instalação"""
        try:
            os.makedirs(self.install_dir, exist_ok=True)
            print(f"✅ Diretório criado: {self.install_dir}")
            return True
        except Exception as e:
            print(f"❌ Erro ao criar diretório: {e}")
            return False
    
    def copy_files(self) -> bool:
        """Copia arquivos do agente"""
        try:
            current_dir = Path(__file__).parent
            
            files_to_copy = [
                'worktrack_agent.py',
                'config.json',
                'requirements.txt'
            ]
            
            for file in files_to_copy:
                src = current_dir / file
                dst = Path(self.install_dir) / file
                
                if src.exists():
                    shutil.copy2(src, dst)
                    print(f"✅ Copiado: {file}")
                else:
                    print(f"❌ Arquivo não encontrado: {file}")
                    return False
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao copiar arquivos: {e}")
            return False
    
    def setup_autostart(self) -> bool:
        """Configura inicialização automática"""
        try:
            if self.system == "Windows":
                return self._setup_autostart_windows()
            elif self.system == "Darwin":
                return self._setup_autostart_macos()
            else:
                return self._setup_autostart_linux()
                
        except Exception as e:
            print(f"❌ Erro ao configurar inicialização automática: {e}")
            return False
    
    def _setup_autostart_windows(self) -> bool:
        """Configura autostart no Windows"""
        try:
            import winreg
            
            key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
            
            agent_path = os.path.join(self.install_dir, 'worktrack_agent.py')
            python_path = sys.executable
            command = f'"{python_path}" "{agent_path}"'
            
            winreg.SetValueEx(key, "WorkTrackAgent", 0, winreg.REG_SZ, command)
            winreg.CloseKey(key)
            
            print("✅ Inicialização automática configurada (Windows)")
            return True
            
        except ImportError:
            print("❌ Biblioteca winreg não disponível")
            return False
    
    def _setup_autostart_macos(self) -> bool:
        """Configura autostart no macOS"""
        try:
            plist_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.worktrack.agent</string>
    <key>Program</key>
    <string>{sys.executable}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{sys.executable}</string>
        <string>{os.path.join(self.install_dir, 'worktrack_agent.py')}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>{self.install_dir}</string>
</dict>
</plist>'''
            
            plist_dir = os.path.expanduser("~/Library/LaunchAgents")
            os.makedirs(plist_dir, exist_ok=True)
            
            plist_path = os.path.join(plist_dir, "com.worktrack.agent.plist")
            
            with open(plist_path, 'w') as f:
                f.write(plist_content)
            
            # Carregar o serviço
            subprocess.run(['launchctl', 'load', plist_path])
            
            print("✅ Inicialização automática configurada (macOS)")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao configurar autostart macOS: {e}")
            return False
    
    def _setup_autostart_linux(self) -> bool:
        """Configura autostart no Linux"""
        try:
            desktop_content = f'''[Desktop Entry]
Type=Application
Name=WorkTrack Agent
Exec={sys.executable} {os.path.join(self.install_dir, 'worktrack_agent.py')}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
'''
            
            autostart_dir = os.path.expanduser("~/.config/autostart")
            os.makedirs(autostart_dir, exist_ok=True)
            
            desktop_path = os.path.join(autostart_dir, "worktrack-agent.desktop")
            
            with open(desktop_path, 'w') as f:
                f.write(desktop_content)
            
            os.chmod(desktop_path, 0o755)
            
            print("✅ Inicialização automática configurada (Linux)")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao configurar autostart Linux: {e}")
            return False
    
    def configure_server(self) -> bool:
        """Configura URL do servidor"""
        try:
            config_path = os.path.join(self.install_dir, 'config.json')
            
            print("\n🔧 Configuração do Servidor")
            print("=" * 40)
            
            server_url = input("URL do servidor (ex: https://worktracksync.online/api): ").strip()
            
            if not server_url:
                print("❌ URL do servidor é obrigatória")
                return False
            
            # Carregar configuração existente
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
            except:
                config = {}
            
            # Atualizar URL do servidor
            config['server_url'] = server_url
            
            # Salvar configuração
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=4)
            
            print(f"✅ Servidor configurado: {server_url}")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao configurar servidor: {e}")
            return False
    
    def test_connection(self) -> bool:
        """Testa conexão com o servidor"""
        try:
            config_path = os.path.join(self.install_dir, 'config.json')
            
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            server_url = config.get('server_url')
            
            if not server_url:
                print("❌ URL do servidor não configurada")
                return False
            
            print(f"🔍 Testando conexão com {server_url}...")
            
            import requests
            response = requests.get(f"{server_url}/ping.php", timeout=10)
            
            if response.status_code == 200:
                print("✅ Conexão com servidor OK")
                return True
            else:
                print(f"❌ Servidor retornou status {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao testar conexão: {e}")
            return False
    
    def start_agent(self) -> bool:
        """Inicia o agente"""
        try:
            agent_path = os.path.join(self.install_dir, 'worktrack_agent.py')
            
            print("🚀 Iniciando WorkTrack Agent...")
            
            if self.system == "Windows":
                subprocess.Popen([sys.executable, agent_path], 
                               creationflags=subprocess.CREATE_NEW_CONSOLE)
            else:
                subprocess.Popen([sys.executable, agent_path])
            
            print("✅ Agent iniciado com sucesso")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao iniciar agent: {e}")
            return False
    
    def install(self) -> bool:
        """Executa instalação completa"""
        print("🚀 WorkTrack Agent - Instalador")
        print("=" * 40)
        
        steps = [
            ("Verificando requisitos", self.check_requirements),
            ("Criando diretório de instalação", self.create_install_directory),
            ("Copiando arquivos", self.copy_files),
            ("Configurando servidor", self.configure_server),
            ("Testando conexão", self.test_connection),
            ("Configurando inicialização automática", self.setup_autostart),
            ("Iniciando agent", self.start_agent)
        ]
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            if not step_func():
                print(f"\n❌ Falha na etapa: {step_name}")
                return False
        
        print("\n🎉 Instalação concluída com sucesso!")
        print(f"📁 Arquivos instalados em: {self.install_dir}")
        print("🔄 O agent será iniciado automaticamente no próximo boot")
        
        return True

def main():
    installer = AgentInstaller()
    
    try:
        success = installer.install()
        if not success:
            print("\n❌ Instalação falhou")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n❌ Instalação cancelada pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro durante instalação: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
