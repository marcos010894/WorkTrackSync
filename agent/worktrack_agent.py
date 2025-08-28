#!/usr/bin/env python3
"""
WorkTrackSync Agent
Sistema de monitoramento de tempo e atividades para computadores corporativos
"""

import os
import sys
import time
import json
import hashlib
import platform
import threading
import requests
import psutil
import logging
from datetime import datetime, date
from typing import Dict, List, Any, Optional
import subprocess
import uuid
import socket
from pathlib import Path

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('worktrack_agent.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class WorkTrackAgent:
    def __init__(self, config_file: str = 'config.json'):
        self.config_file = config_file
        self.config = self.load_config()
        self.computer_id = self.get_computer_id()
        self.session = requests.Session()
        self.is_running = False
        self.current_programs = {}
        self.session_start_time = datetime.now()
        
        # Configurar headers padrão
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': f'WorkTrackAgent/1.0 ({platform.system()})',
            'X-Computer-ID': self.computer_id
        })
        
        logger.info(f"WorkTrack Agent iniciado - Computer ID: {self.computer_id}")

    def load_config(self) -> Dict[str, Any]:
        """Carrega configurações do arquivo JSON"""
        default_config = {
            'server_url': 'https://worktracksync.online/api',
            'monitoring_interval': 300,  # 5 minutos
            'heartbeat_interval': 60,    # 1 minuto
            'enable_remote_commands': True,
            'auto_start': True,
            'log_level': 'INFO'
        }
        
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    # Mesclar com configurações padrão
                    default_config.update(config)
            else:
                # Criar arquivo de configuração padrão
                self.save_config(default_config)
        except Exception as e:
            logger.error(f"Erro ao carregar configurações: {e}")
        
        return default_config

    def save_config(self, config: Dict[str, Any]) -> None:
        """Salva configurações no arquivo JSON"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Erro ao salvar configurações: {e}")

    def get_computer_id(self) -> str:
        """Gera um ID único para o computador"""
        try:
            # Usar MAC address + hostname para gerar ID único
            mac = hex(uuid.getnode())[2:].upper()
            hostname = socket.gethostname()
            unique_string = f"{mac}-{hostname}-{platform.system()}"
            computer_id = hashlib.md5(unique_string.encode()).hexdigest()[:16].upper()
            return computer_id
        except Exception as e:
            logger.error(f"Erro ao gerar Computer ID: {e}")
            return str(uuid.uuid4())[:16].upper()

    def get_system_info(self) -> Dict[str, Any]:
        """Coleta informações do sistema"""
        try:
            return {
                'computer_name': socket.gethostname(),
                'user_name': os.getenv('USER') or os.getenv('USERNAME') or 'Unknown',
                'os_info': f"{platform.system()} {platform.release()} {platform.machine()}",
                'ip_address': self.get_local_ip(),
                'mac_address': ':'.join([hex(uuid.getnode())[i:i+2] for i in range(2, 14, 2)]),
                'agent_version': '1.0.0'
            }
        except Exception as e:
            logger.error(f"Erro ao coletar informações do sistema: {e}")
            return {}

    def get_local_ip(self) -> str:
        """Obtém o IP local da máquina"""
        try:
            # Conectar a um endereço remoto para descobrir IP local
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"

    def get_running_programs(self) -> List[Dict[str, Any]]:
        """Obtém lista de programas em execução"""
        programs = []
        try:
            for proc in psutil.process_iter(['pid', 'name', 'exe', 'create_time']):
                try:
                    proc_info = proc.info
                    if proc_info['name'] and proc_info['exe']:
                        programs.append({
                            'pid': proc_info['pid'],
                            'name': proc_info['name'],
                            'path': proc_info['exe'],
                            'start_time': datetime.fromtimestamp(proc_info['create_time']).isoformat()
                        })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
                    
        except Exception as e:
            logger.error(f"Erro ao obter programas em execução: {e}")
        
        return programs

    def get_active_window_info(self) -> Optional[Dict[str, Any]]:
        """Obtém informações da janela ativa (específico do SO)"""
        try:
            if platform.system() == "Windows":
                return self._get_active_window_windows()
            elif platform.system() == "Darwin":  # macOS
                return self._get_active_window_macos()
            elif platform.system() == "Linux":
                return self._get_active_window_linux()
        except Exception as e:
            logger.error(f"Erro ao obter janela ativa: {e}")
        return None

    def _get_active_window_windows(self) -> Optional[Dict[str, Any]]:
        """Obtém janela ativa no Windows"""
        try:
            import win32gui
            import win32process
            
            hwnd = win32gui.GetForegroundWindow()
            if hwnd:
                window_title = win32gui.GetWindowText(hwnd)
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                process = psutil.Process(pid)
                return {
                    'window_title': window_title,
                    'program_name': process.name(),
                    'program_path': process.exe()
                }
        except ImportError:
            logger.warning("Bibliotecas do Windows não disponíveis")
        except Exception as e:
            logger.error(f"Erro ao obter janela ativa (Windows): {e}")
        return None

    def _get_active_window_macos(self) -> Optional[Dict[str, Any]]:
        """Obtém janela ativa no macOS"""
        try:
            script = '''
            tell application "System Events"
                set frontApp to first application process whose frontmost is true
                set appName to name of frontApp
                try
                    set windowTitle to name of first window of frontApp
                on error
                    set windowTitle to appName
                end try
            end tell
            return appName & "|" & windowTitle
            '''
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            if result.returncode == 0:
                parts = result.stdout.strip().split('|')
                if len(parts) >= 2:
                    return {
                        'program_name': parts[0],
                        'window_title': parts[1],
                        'program_path': parts[0]
                    }
        except Exception as e:
            logger.error(f"Erro ao obter janela ativa (macOS): {e}")
        return None

    def _get_active_window_linux(self) -> Optional[Dict[str, Any]]:
        """Obtém janela ativa no Linux"""
        try:
            # Tentar com xdotool
            result = subprocess.run(['xdotool', 'getactivewindow', 'getwindowname'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                window_title = result.stdout.strip()
                
                # Tentar obter o processo
                pid_result = subprocess.run(['xdotool', 'getactivewindow', 'getwindowpid'], 
                                          capture_output=True, text=True)
                if pid_result.returncode == 0:
                    pid = int(pid_result.stdout.strip())
                    process = psutil.Process(pid)
                    return {
                        'window_title': window_title,
                        'program_name': process.name(),
                        'program_path': process.exe()
                    }
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("xdotool não disponível no sistema")
        except Exception as e:
            logger.error(f"Erro ao obter janela ativa (Linux): {e}")
        return None

    def calculate_usage_time(self) -> int:
        """Calcula tempo de uso em minutos desde o início da sessão"""
        delta = datetime.now() - self.session_start_time
        return int(delta.total_seconds() / 60)

    def send_heartbeat(self) -> bool:
        """Envia heartbeat para o servidor"""
        try:
            data = {
                'computer_id': self.computer_id,
                'timestamp': datetime.now().isoformat(),
                'status': 'online',
                'usage_minutes': self.calculate_usage_time()
            }
            
            response = self.session.post(
                f"{self.config['server_url']}/heartbeat.php",
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.debug("Heartbeat enviado com sucesso")
                return True
            else:
                logger.error(f"Erro no heartbeat: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Erro ao enviar heartbeat: {e}")
        
        return False

    def send_system_info(self) -> bool:
        """Envia informações do sistema para o servidor"""
        try:
            system_info = self.get_system_info()
            system_info['computer_id'] = self.computer_id
            
            response = self.session.post(
                f"{self.config['server_url']}/register.php",
                json=system_info,
                timeout=15
            )
            
            if response.status_code == 200:
                logger.info("Informações do sistema enviadas com sucesso")
                return True
            else:
                logger.error(f"Erro ao registrar sistema: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Erro ao enviar informações do sistema: {e}")
        
        return False

    def send_activity_data(self) -> bool:
        """Envia dados de atividade para o servidor"""
        try:
            programs = self.get_running_programs()
            active_window = self.get_active_window_info()
            
            data = {
                'computer_id': self.computer_id,
                'timestamp': datetime.now().isoformat(),
                'session_date': date.today().isoformat(),
                'usage_minutes': self.calculate_usage_time(),
                'running_programs': programs,
                'active_window': active_window
            }
            
            response = self.session.post(
                f"{self.config['server_url']}/activity.php",
                json=data,
                timeout=15
            )
            
            if response.status_code == 200:
                logger.debug("Dados de atividade enviados com sucesso")
                return True
            else:
                logger.error(f"Erro ao enviar dados de atividade: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Erro ao enviar dados de atividade: {e}")
        
        return False

    def check_remote_commands(self) -> None:
        """Verifica comandos remotos pendentes"""
        try:
            response = self.session.get(
                f"{self.config['server_url']}/commands.php",
                params={'computer_id': self.computer_id},
                timeout=10
            )
            
            if response.status_code == 200:
                commands = response.json()
                for command in commands:
                    self.execute_remote_command(command)
                    
        except Exception as e:
            logger.error(f"Erro ao verificar comandos remotos: {e}")

    def execute_remote_command(self, command: Dict[str, Any]) -> None:
        """Executa um comando remoto"""
        try:
            command_type = command.get('command_type')
            command_id = command.get('id')
            
            logger.info(f"Executando comando remoto: {command_type}")
            
            result = {'status': 'failed', 'message': 'Comando desconhecido'}
            
            if command_type == 'lock':
                result = self._lock_computer()
            elif command_type == 'message':
                message = command.get('command_data', 'Mensagem do administrador')
                result = self._show_message(message)
            elif command_type == 'restart':
                result = self._restart_computer()
            elif command_type == 'shutdown':
                result = self._shutdown_computer()
            
            # Reportar resultado
            self._report_command_result(command_id, result)
            
        except Exception as e:
            logger.error(f"Erro ao executar comando remoto: {e}")
            self._report_command_result(command.get('id'), {
                'status': 'failed', 
                'message': str(e)
            })

    def _lock_computer(self) -> Dict[str, Any]:
        """Bloqueia o computador"""
        try:
            if platform.system() == "Windows":
                os.system("rundll32.exe user32.dll,LockWorkStation")
            elif platform.system() == "Darwin":  # macOS
                os.system("/System/Library/CoreServices/Menu\ Extras/User.menu/Contents/Resources/CGSession -suspend")
            elif platform.system() == "Linux":
                os.system("gnome-screensaver-command -l || xdg-screensaver lock")
            
            return {'status': 'success', 'message': 'Computador bloqueado'}
        except Exception as e:
            return {'status': 'failed', 'message': str(e)}

    def _show_message(self, message: str) -> Dict[str, Any]:
        """Exibe mensagem para o usuário"""
        try:
            if platform.system() == "Windows":
                import ctypes
                ctypes.windll.user32.MessageBoxW(0, message, "WorkTrack Admin", 1)
            elif platform.system() == "Darwin":  # macOS
                os.system(f'osascript -e \'display notification "{message}" with title "WorkTrack Admin"\'')
            elif platform.system() == "Linux":
                os.system(f'notify-send "WorkTrack Admin" "{message}"')
            
            return {'status': 'success', 'message': 'Mensagem exibida'}
        except Exception as e:
            return {'status': 'failed', 'message': str(e)}

    def _restart_computer(self) -> Dict[str, Any]:
        """Reinicia o computador"""
        try:
            if platform.system() == "Windows":
                os.system("shutdown /r /t 60")
            else:
                os.system("sudo shutdown -r +1")
            
            return {'status': 'success', 'message': 'Reinicialização agendada'}
        except Exception as e:
            return {'status': 'failed', 'message': str(e)}

    def _shutdown_computer(self) -> Dict[str, Any]:
        """Desliga o computador"""
        try:
            if platform.system() == "Windows":
                os.system("shutdown /s /t 60")
            else:
                os.system("sudo shutdown -h +1")
            
            return {'status': 'success', 'message': 'Desligamento agendado'}
        except Exception as e:
            return {'status': 'failed', 'message': str(e)}

    def _report_command_result(self, command_id: int, result: Dict[str, Any]) -> None:
        """Reporta resultado de comando para o servidor"""
        try:
            data = {
                'command_id': command_id,
                'result': result,
                'executed_at': datetime.now().isoformat()
            }
            
            response = self.session.post(
                f"{self.config['server_url']}/command_result.php",
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Resultado do comando {command_id} reportado")
            else:
                logger.error(f"Erro ao reportar resultado do comando: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Erro ao reportar resultado do comando: {e}")

    def heartbeat_worker(self) -> None:
        """Worker thread para heartbeat"""
        while self.is_running:
            try:
                self.send_heartbeat()
                if self.config.get('enable_remote_commands'):
                    self.check_remote_commands()
                
                time.sleep(self.config['heartbeat_interval'])
            except Exception as e:
                logger.error(f"Erro no worker de heartbeat: {e}")
                time.sleep(self.config['heartbeat_interval'])

    def monitoring_worker(self) -> None:
        """Worker thread para monitoramento"""
        while self.is_running:
            try:
                self.send_activity_data()
                time.sleep(self.config['monitoring_interval'])
            except Exception as e:
                logger.error(f"Erro no worker de monitoramento: {e}")
                time.sleep(self.config['monitoring_interval'])

    def test_server_connectivity(self) -> bool:
        """Testa conectividade com o servidor"""
        try:
            logger.info("Testando conectividade com o servidor...")
            
            # Testar API de teste
            test_url = f"{self.config['server_url']}/api/test.php"
            
            # Teste GET
            response = self.session.get(test_url, timeout=10)
            if response.status_code == 200:
                logger.info("✅ Conectividade GET OK")
            else:
                logger.warning(f"⚠️ Teste GET falhou: {response.status_code}")
            
            # Teste POST
            test_data = {
                'test': True,
                'computer_id': self.computer_id,
                'timestamp': datetime.now().isoformat(),
                'message': 'Teste de conectividade'
            }
            
            response = self.session.post(test_url, json=test_data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                logger.info("✅ Conectividade POST OK")
                logger.info(f"🌐 Servidor: {result.get('message', 'Sem mensagem')}")
                logger.info(f"🕒 Hora do servidor: {result.get('server_time', 'Desconhecida')}")
                logger.info(f"🔗 CORS habilitado: {result.get('cors_enabled', False)}")
                return True
            else:
                logger.error(f"❌ Teste POST falhou: {response.status_code}")
                return False
                
        except requests.exceptions.ConnectException:
            logger.error("❌ Não foi possível conectar ao servidor")
            logger.error(f"🔗 URL: {self.config['server_url']}")
            logger.error("💡 Verifique se o servidor está rodando e a URL está correta")
            return False
        except requests.exceptions.Timeout:
            logger.error("❌ Timeout na conexão com o servidor")
            return False
        except Exception as e:
            logger.error(f"❌ Erro na conectividade: {e}")
            return False

    def start(self) -> None:
        """Inicia o agente"""
        logger.info("Iniciando WorkTrack Agent...")
        
        # Testar conectividade primeiro
        if not self.test_server_connectivity():
            logger.error("❌ Falha na conectividade com o servidor")
            logger.error("🔧 Verifique a configuração e tente novamente")
            return
        
        # Registrar sistema
        if not self.send_system_info():
            logger.warning("Falha ao registrar sistema, continuando...")
        
        self.is_running = True
        
        # Iniciar threads de trabalho
        heartbeat_thread = threading.Thread(target=self.heartbeat_worker, daemon=True)
        monitoring_thread = threading.Thread(target=self.monitoring_worker, daemon=True)
        
        heartbeat_thread.start()
        monitoring_thread.start()
        
        logger.info("WorkTrack Agent iniciado com sucesso")
        
        try:
            # Loop principal
            while self.is_running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Parando WorkTrack Agent...")
            self.stop()

    def stop(self) -> None:
        """Para o agente"""
        self.is_running = False
        logger.info("WorkTrack Agent parado")

def main():
    """Função principal"""
    agent = WorkTrackAgent()
    
    try:
        agent.start()
    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
