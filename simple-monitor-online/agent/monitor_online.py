#!/usr/bin/env python3
"""
Monitor de Atividade - Agente Online
Sistema de monitoramento via HTTP/REST API
Compatível com macOS e Windows
"""

import json
import time
import os
import sys
import threading
import subprocess
import requests
from datetime import datetime, date
import platform

class OnlineActivityMonitor:
    def __init__(self, server_url="https://simple-monitor-online-8tcelcoc8-marcos10895s-projects.vercel.app"):
        # Remover apenas /api no final se presente
        if server_url.endswith('/api'):
            self.server_url = server_url[:-4]
        else:
            self.server_url = server_url.rstrip('/')
        
        # Carregar configuração personalizada se existir
        self.device_config = self.load_device_config()
        
        self.computer_id = self.get_computer_id()
        self.computer_name = self.get_computer_name()
        self.user_name = self.get_user_name()
        self.os_info = self.get_os_info()
        
        # Controle de tempo simplificado
        self.current_day = date.today()
        self.minutes_sent_today = 0  # Contador simples de minutos enviados hoje
        self.last_send_time = time.time()  # Último momento em que enviou
        self.is_running = False
        
        print(f"🖥️ Monitor Online iniciado")
        print(f"🌐 Servidor: {self.server_url}")
        print(f"💻 Computador: {self.computer_name}")
        print(f"👤 Usuário: {self.user_name}")
        print(f"🆔 ID: {self.computer_id}")
        print(f"💓 Sistema: Heartbeat a cada 60s (servidor controla tempo)")

    def load_device_config(self):
        """Carregar configuração personalizada do dispositivo"""
        config_file = os.path.join(os.path.dirname(__file__), 'device_config.json')
        try:
            if os.path.exists(config_file):
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    print(f"✅ Configuração carregada: {config_file}")
                    return config
        except Exception as e:
            print(f"⚠️ Erro ao carregar configuração: {e}")
        
        return {}

    def get_computer_id(self):
        """Gerar ID único para o computador"""
        try:
            if platform.system() == "Windows":
                computer_name = os.environ.get('COMPUTERNAME', 'unknown')
                user_name = os.environ.get('USERNAME', 'unknown')
            else:
                computer_name = platform.node()
                user_name = os.environ.get('USER', 'unknown')
            
            return f"{computer_name}-{user_name}".lower().replace(' ', '-')
        except:
            return f"pc-{int(time.time())}"

    def get_computer_name(self):
        """Obter nome do computador - com suporte para configuração personalizada"""
        # Verificar se há nome personalizado na configuração
        if hasattr(self, 'device_config') and 'device_name' in self.device_config:
            custom_name = self.device_config['device_name']
            if custom_name and custom_name.strip():
                print(f"📝 Usando nome personalizado: {custom_name}")
                return custom_name.strip()
        
        # Usar nome padrão do sistema
        try:
            if platform.system() == "Windows":
                return os.environ.get('COMPUTERNAME', 'PC-Desconhecido')
            else:
                return platform.node()
        except:
            return 'Computador-Desconhecido'

    def get_user_name(self):
        """Obter nome do usuário - com suporte para configuração personalizada"""
        # Verificar se há nome de usuário personalizado na configuração
        if hasattr(self, 'device_config') and 'user_name' in self.device_config:
            custom_user = self.device_config['user_name']
            if custom_user and custom_user.strip():
                print(f"👤 Usando usuário personalizado: {custom_user}")
                return custom_user.strip()
        
        # Usar nome padrão do sistema
        try:
            if platform.system() == "Windows":
                return os.environ.get('USERNAME', 'Usuario-Desconhecido')
            else:
                return os.environ.get('USER', 'Usuario-Desconhecido')
        except:
            return 'Usuario-Desconhecido'

    def get_os_info(self):
        """Obter informações do sistema operacional"""
        try:
            return f"{platform.system()} {platform.release()}"
        except:
            return "Sistema Desconhecido"

    def get_active_window(self):
        """Obter janela ativa atual - versão multiplataforma"""
        try:
            if platform.system() == "Darwin":  # macOS
                script = '''
                tell application "System Events"
                    name of application processes whose frontmost is true
                end tell
                '''
                result = subprocess.run(['osascript', '-e', script], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    app_name = result.stdout.strip()
                    return {
                        'window_title': app_name,
                        'process_name': app_name
                    }
            
            elif platform.system() == "Windows":
                # Implementar para Windows se necessário
                try:
                    import win32gui
                    import win32process
                    import psutil
                    
                    hwnd = win32gui.GetForegroundWindow()
                    window_text = win32gui.GetWindowText(hwnd)
                    
                    if window_text:
                        _, pid = win32process.GetWindowThreadProcessId(hwnd)
                        try:
                            process = psutil.Process(pid)
                            process_name = process.name()
                            return {
                                'window_title': window_text,
                                'process_name': process_name
                            }
                        except:
                            return {
                                'window_title': window_text,
                                'process_name': 'Desconhecido'
                            }
                except ImportError:
                    pass
            
            return None
        except Exception as e:
            return None

    def get_current_activity(self):
        """Determinar atividade atual baseada na janela ativa"""
        window_info = self.get_active_window()
        
        if not window_info:
            return "Sistema Ativo"
        
        process_name = window_info['process_name'].lower()
        window_title = window_info['window_title'].lower()
        
        # Categorizar atividades
        if any(browser in process_name for browser in ['chrome', 'firefox', 'safari', 'edge']):
            if any(site in window_title for site in ['youtube', 'netflix', 'twitch']):
                return "Assistindo Vídeos"
            elif any(social in window_title for social in ['facebook', 'instagram', 'twitter']):
                return "Redes Sociais"
            else:
                return "Navegando na Internet"
        
        elif any(office in process_name for office in ['word', 'excel', 'powerpoint', 'pages', 'numbers']):
            return "Trabalhando em Documentos"
        
        elif any(dev in process_name for dev in ['code', 'visual', 'pycharm', 'sublime', 'xcode']):
            return "Programando"
        
        elif any(game in process_name for game in ['steam', 'game']):
            return "Jogando"
        
        elif 'terminal' in process_name or 'iterm' in process_name or 'cmd' in process_name:
            return "Usando Terminal"
        
        else:
            return f"Usando {window_info['process_name']}"

    def register(self):
        """Registrar computador no servidor"""
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
                print("✅ Computador registrado no servidor")
                return True
            else:
                print(f"❌ Erro ao registrar: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            return False

    def send_activity(self):
        """Enviar heartbeat simples para o servidor"""
        try:
            now = datetime.now()
            today = now.date()
            current_time = time.time()
            
            # Verificar se é um novo dia
            if today != self.current_day:
                print(f"🗓️ Novo dia detectado: {today}")
                self.current_day = today
                self.minutes_sent_today = 0
                self.last_send_time = current_time
                print(f"🔄 Reiniciando para novo dia")
            
            # Verificar se passou pelo menos 60 segundos desde o último envio
            time_diff = current_time - self.last_send_time
            
            if time_diff >= 60:  # 60 segundos = 1 minuto
                # Obter apenas atividade atual (opcional)
                activity = self.get_current_activity()
                window_info = self.get_active_window()
                
                # ENVIAR APENAS HEARTBEAT - servidor controla o tempo
                data = {
                    'type': 'heartbeat',
                    'computer_id': self.computer_id,
                    'computer_name': self.computer_name,
                    'user_name': self.user_name,
                    'os_info': self.os_info,
                    'current_activity': activity,
                    'active_window': window_info['window_title'] if window_info else None,
                    'timestamp': now.isoformat(),
                    'is_active': True
                }
                
                response = requests.post(f'{self.server_url}/api/data', 
                                       json=data, timeout=10)
                
                # Enviar também para WebSocket (tempo real)
                try:
                    requests.post(f'{self.server_url}/api/websocket', 
                                json=data, timeout=5)
                except:
                    pass
                
                if response.status_code == 200:
                    # Atualizar apenas o contador local para debug
                    self.minutes_sent_today += 1
                    self.last_send_time = current_time
                    
                    print(f"💓 Heartbeat enviado - {activity} (Heartbeats hoje: {self.minutes_sent_today})")
                    return True
                else:
                    print(f"❌ Erro ao enviar heartbeat: {response.status_code}")
                    return False
            
            return True  # Ainda não passou 1 minuto
                
        except Exception as e:
            print(f"❌ Erro ao enviar heartbeat: {e}")
            return False

    def check_commands(self):
        """Verificar comandos pendentes do servidor"""
        try:
            response = requests.get(f'{self.server_url}/api/commands', 
                                  params={'computer_id': self.computer_id}, 
                                  timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('commands'):
                    for command in data['commands']:
                        self.execute_command(command['action'])
                        
        except Exception as e:
            print(f"❌ Erro ao verificar comandos: {e}")

    def execute_command(self, action):
        """Executar comandos remotos"""
        print(f"🎮 Executando comando: {action}")
        
        try:
            if action == 'lock':
                if platform.system() == "Darwin":  # macOS
                    subprocess.run(['pmset', 'displaysleepnow'])
                elif platform.system() == "Windows":
                    import ctypes
                    ctypes.windll.user32.LockWorkStation()
                print("🔒 Tela bloqueada")
                
            elif action == 'shutdown':
                if platform.system() == "Darwin":  # macOS
                    subprocess.run(['sudo', 'shutdown', '-h', '+1'])
                elif platform.system() == "Windows":
                    subprocess.run(['shutdown', '/s', '/t', '60'])
                print("⚡ Desligando em 1 minuto")
                
            elif action == 'restart':
                if platform.system() == "Darwin":  # macOS
                    subprocess.run(['sudo', 'shutdown', '-r', '+1'])
                elif platform.system() == "Windows":
                    subprocess.run(['shutdown', '/r', '/t', '60'])
                print("🔄 Reiniciando em 1 minuto")
                
        except Exception as e:
            print(f"❌ Erro ao executar comando {action}: {e}")

    def monitor_loop(self):
        """Loop principal de monitoramento"""
        print("👁️ Iniciando monitoramento...")
        print("💓 Enviando heartbeat a cada minuto (servidor controla tempo)")
        
        # Registrar computador
        if not self.register():
            print("❌ Falha ao registrar. Tentando novamente em 30s...")
            time.sleep(30)
            return self.monitor_loop()
        
        while self.is_running:
            try:
                # Enviar heartbeat (servidor incrementa tempo automaticamente)
                self.send_activity()
                
                # Verificar comandos
                self.check_commands()
                
                # Aguardar 60 segundos para próximo heartbeat
                time.sleep(60)
                
            except KeyboardInterrupt:
                print("\n👋 Monitor interrompido pelo usuário")
                break
            except Exception as e:
                print(f"❌ Erro no loop: {e}")
                time.sleep(60)

    def start(self):
        """Iniciar o monitor"""
        self.is_running = True
        print("🚀 Iniciando monitor online...")
        
        try:
            # Apenas loop principal - sem thread separada de heartbeat
            self.monitor_loop()
            
        except Exception as e:
            print(f"❌ Erro crítico: {e}")
            time.sleep(10)
            self.start()  # Reiniciar

    def stop(self):
        """Parar o monitor"""
        self.is_running = False
        print("🛑 Monitor parado")

def main():
    # URL do servidor
    server_url = "https://simple-monitor-online-m9atimlxb-marcos10895s-projects.vercel.app"
    
    # Verificar argumentos da linha de comando
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
    
    print("=" * 60)
    print("🌐 MONITOR ONLINE - AGENTE MULTIPLATAFORMA")
    print("=" * 60)
    print(f"Sistema: {platform.system()} {platform.release()}")
    print(f"Python: {platform.python_version()}")
    
    monitor = OnlineActivityMonitor(server_url)
    
    try:
        monitor.start()
    except KeyboardInterrupt:
        print("\n👋 Encerrando monitor...")
        monitor.stop()

if __name__ == "__main__":
    main()
