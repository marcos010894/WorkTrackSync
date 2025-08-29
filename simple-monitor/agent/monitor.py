#!/usr/bin/env python3
"""
Monitor de Atividade - Agente para Windows
Sistema simples de monitoramento em tempo real
"""

import json
import time
import os
import sys
import threading
import subprocess
import psutil
import win32gui
import win32process
import websocket
from datetime import datetime
import ctypes
from ctypes import wintypes

class ActivityMonitor:
    def __init__(self, server_url="ws://localhost:3000"):
        self.server_url = server_url
        self.ws = None
        self.is_running = False
        self.computer_id = self.get_computer_id()
        self.computer_name = os.environ.get('COMPUTERNAME', 'PC-Desconhecido')
        self.user_name = os.environ.get('USERNAME', 'Usuario-Desconhecido')
        self.total_minutes = 0
        self.start_time = time.time()
        
        print(f"🖥️ Monitor iniciado para: {self.computer_name}")
        print(f"👤 Usuário: {self.user_name}")
        print(f"🆔 ID: {self.computer_id}")

    def get_computer_id(self):
        """Gerar ID único para o computador"""
        try:
            # Usar nome do computador + usuário como ID
            computer_name = os.environ.get('COMPUTERNAME', 'unknown')
            user_name = os.environ.get('USERNAME', 'unknown')
            return f"{computer_name}-{user_name}".lower()
        except:
            return f"pc-{int(time.time())}"

    def get_os_info(self):
        """Obter informações do sistema operacional"""
        try:
            import platform
            return f"{platform.system()} {platform.release()}"
        except:
            return "Windows"

    def get_active_window(self):
        """Obter janela ativa atual"""
        try:
            hwnd = win32gui.GetForegroundWindow()
            window_text = win32gui.GetWindowText(hwnd)
            
            if window_text:
                # Obter processo da janela
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
            
            return None
        except Exception as e:
            return None

    def get_current_activity(self):
        """Determinar atividade atual baseada na janela ativa"""
        window_info = self.get_active_window()
        
        if not window_info:
            return "Sistema Inativo"
        
        process_name = window_info['process_name'].lower()
        window_title = window_info['window_title'].lower()
        
        # Categorizar atividades
        if any(browser in process_name for browser in ['chrome', 'firefox', 'edge', 'safari']):
            if any(site in window_title for site in ['youtube', 'netflix', 'twitch']):
                return "Assistindo Vídeos"
            elif any(social in window_title for social in ['facebook', 'instagram', 'twitter']):
                return "Redes Sociais"
            else:
                return "Navegando na Internet"
        
        elif any(office in process_name for office in ['word', 'excel', 'powerpoint', 'notepad']):
            return "Trabalhando em Documentos"
        
        elif any(dev in process_name for dev in ['code', 'visual', 'pycharm', 'sublime']):
            return "Programando"
        
        elif any(game in process_name for game in ['steam', 'game', 'minecraft']):
            return "Jogando"
        
        elif 'explorer' in process_name:
            return "Explorando Arquivos"
        
        else:
            return f"Usando {window_info['process_name']}"

    def connect(self):
        """Conectar ao servidor WebSocket"""
        try:
            print(f"🔗 Conectando ao servidor: {self.server_url}")
            self.ws = websocket.WebSocketApp(
                self.server_url,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close
            )
            
            # Executar em thread separada
            self.ws.run_forever()
            
        except Exception as e:
            print(f"❌ Erro ao conectar: {e}")
            time.sleep(5)
            self.connect()  # Reconectar

    def on_open(self, ws):
        """Callback quando conexão é estabelecida"""
        print("✅ Conectado ao servidor!")
        self.is_running = True
        
        # Registrar computador
        register_data = {
            'type': 'register',
            'computer_id': self.computer_id,
            'computer_name': self.computer_name,
            'user_name': self.user_name,
            'os_info': self.get_os_info()
        }
        
        ws.send(json.dumps(register_data))
        
        # Iniciar thread de monitoramento
        monitor_thread = threading.Thread(target=self.monitor_activity)
        monitor_thread.daemon = True
        monitor_thread.start()

    def on_message(self, ws, message):
        """Callback para mensagens recebidas"""
        try:
            data = json.loads(message)
            if data.get('type') == 'remote_command':
                self.handle_remote_command(data.get('action'))
        except Exception as e:
            print(f"❌ Erro ao processar mensagem: {e}")

    def on_error(self, ws, error):
        """Callback para erros"""
        print(f"❌ Erro WebSocket: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        """Callback quando conexão é fechada"""
        print("❌ Conexão perdida. Tentando reconectar...")
        self.is_running = False
        time.sleep(5)
        self.connect()

    def handle_remote_command(self, action):
        """Executar comandos remotos"""
        print(f"🎮 Comando recebido: {action}")
        
        try:
            if action == 'lock':
                # Bloquear tela
                ctypes.windll.user32.LockWorkStation()
                print("🔒 Tela bloqueada")
                
            elif action == 'shutdown':
                # Desligar computador
                os.system("shutdown /s /t 5")
                print("⚡ Desligando computador em 5 segundos")
                
            elif action == 'restart':
                # Reiniciar computador
                os.system("shutdown /r /t 5")
                print("🔄 Reiniciando computador em 5 segundos")
                
        except Exception as e:
            print(f"❌ Erro ao executar comando {action}: {e}")

    def monitor_activity(self):
        """Thread principal de monitoramento"""
        print("👁️ Iniciando monitoramento de atividade...")
        
        while self.is_running:
            try:
                # Calcular tempo total
                current_time = time.time()
                self.total_minutes = int((current_time - self.start_time) / 60)
                
                # Obter atividade atual
                activity = self.get_current_activity()
                window_info = self.get_active_window()
                
                # Enviar dados
                activity_data = {
                    'type': 'activity',
                    'computer_id': self.computer_id,
                    'total_minutes': self.total_minutes,
                    'current_activity': activity,
                    'active_window': window_info['window_title'] if window_info else None,
                    'timestamp': datetime.now().isoformat()
                }
                
                if self.ws:
                    self.ws.send(json.dumps(activity_data))
                
                print(f"📊 {activity} - {self.total_minutes}min")
                
                # Aguardar antes da próxima verificação
                time.sleep(10)  # Atualizar a cada 10 segundos
                
            except Exception as e:
                print(f"❌ Erro no monitoramento: {e}")
                time.sleep(10)

    def start(self):
        """Iniciar o monitor"""
        print("🚀 Iniciando monitor de atividade...")
        
        try:
            self.connect()
        except KeyboardInterrupt:
            print("\n👋 Monitor interrompido pelo usuário")
            self.stop()
        except Exception as e:
            print(f"❌ Erro crítico: {e}")
            time.sleep(5)
            self.start()  # Reiniciar

    def stop(self):
        """Parar o monitor"""
        self.is_running = False
        if self.ws:
            self.ws.close()
        print("🛑 Monitor parado")

def main():
    # Verificar se está no Windows
    if os.name != 'nt':
        print("❌ Este monitor só funciona no Windows")
        return
    
    # URL do servidor (alterar se necessário)
    server_url = "ws://localhost:3000"
    
    # Verificar argumentos da linha de comando
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
    
    print("=" * 50)
    print("🖥️  MONITOR DE ATIVIDADE - AGENTE WINDOWS")
    print("=" * 50)
    
    monitor = ActivityMonitor(server_url)
    monitor.start()

if __name__ == "__main__":
    main()
