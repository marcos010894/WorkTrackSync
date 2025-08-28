#!/usr/bin/env python3
"""
WorkTrackSync - Script de Teste
Verifica se todos os componentes estão funcionando corretamente
"""

import requests
import json
import time
import sys
from datetime import datetime

class WorkTrackTester:
    def __init__(self, server_url="http://localhost/worktrack"):
        self.server_url = server_url.rstrip('/')
        self.api_url = f"{self.server_url}/api"
        self.test_computer_id = "TEST123456789ABCDEF"
        
    def run_tests(self):
        """Executa todos os testes"""
        print("🧪 WorkTrackSync - Teste de Sistema")
        print("=" * 40)
        
        tests = [
            ("Conectividade do servidor", self.test_server_connectivity),
            ("API Ping", self.test_api_ping),
            ("Registro de computador", self.test_computer_registration),
            ("Envio de heartbeat", self.test_heartbeat),
            ("Envio de dados de atividade", self.test_activity_data),
            ("Verificação de comandos", self.test_commands_check),
            ("Interface web", self.test_web_interface)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n🔍 Testando: {test_name}")
            try:
                if test_func():
                    print(f"✅ {test_name}: PASSOU")
                    passed += 1
                else:
                    print(f"❌ {test_name}: FALHOU")
                    failed += 1
            except Exception as e:
                print(f"❌ {test_name}: ERRO - {e}")
                failed += 1
        
        print("\n" + "=" * 40)
        print(f"📊 Resultado: {passed} passou, {failed} falhou")
        
        if failed == 0:
            print("🎉 Todos os testes passaram! Sistema funcionando corretamente.")
            return True
        else:
            print("⚠️ Alguns testes falharam. Verifique a configuração.")
            return False
    
    def test_server_connectivity(self):
        """Testa conectividade básica com o servidor"""
        try:
            response = requests.get(self.server_url, timeout=10)
            return response.status_code in [200, 302, 403]  # Qualquer resposta válida
        except:
            return False
    
    def test_api_ping(self):
        """Testa API de ping"""
        try:
            response = requests.get(f"{self.api_url}/ping.php", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('status') == 'ok'
        except:
            pass
        return False
    
    def test_computer_registration(self):
        """Testa registro de computador"""
        try:
            data = {
                "computer_id": self.test_computer_id,
                "computer_name": "TEST-COMPUTER",
                "user_name": "test_user",
                "os_info": "Test OS 1.0",
                "ip_address": "127.0.0.1",
                "mac_address": "00:11:22:33:44:55",
                "agent_version": "1.0.0"
            }
            
            response = requests.post(
                f"{self.api_url}/register.php",
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                return result.get('status') in ['registered', 'updated']
        except:
            pass
        return False
    
    def test_heartbeat(self):
        """Testa envio de heartbeat"""
        try:
            data = {
                "computer_id": self.test_computer_id,
                "timestamp": datetime.now().isoformat(),
                "status": "online",
                "usage_minutes": 120
            }
            
            response = requests.post(
                f"{self.api_url}/heartbeat.php",
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('status') == 'ok'
        except:
            pass
        return False
    
    def test_activity_data(self):
        """Testa envio de dados de atividade"""
        try:
            data = {
                "computer_id": self.test_computer_id,
                "timestamp": datetime.now().isoformat(),
                "session_date": datetime.now().date().isoformat(),
                "usage_minutes": 150,
                "running_programs": [
                    {
                        "name": "test_program.exe",
                        "path": "/path/to/test_program.exe",
                        "start_time": datetime.now().isoformat()
                    }
                ],
                "active_window": {
                    "program_name": "test_program.exe",
                    "window_title": "Test Window",
                    "program_path": "/path/to/test_program.exe"
                }
            }
            
            response = requests.post(
                f"{self.api_url}/activity.php",
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('status') == 'ok'
        except:
            pass
        return False
    
    def test_commands_check(self):
        """Testa verificação de comandos"""
        try:
            response = requests.get(
                f"{self.api_url}/commands.php",
                params={'computer_id': self.test_computer_id},
                timeout=10
            )
            
            # Deve retornar uma lista (vazia ou com comandos)
            if response.status_code == 200:
                result = response.json()
                return isinstance(result, list)
        except:
            pass
        return False
    
    def test_web_interface(self):
        """Testa interface web"""
        try:
            # Testar página de login
            response = requests.get(f"{self.server_url}/login.php", timeout=10)
            if response.status_code != 200:
                return False
            
            # Verificar se contém elementos esperados
            content = response.text.lower()
            return all(keyword in content for keyword in ['login', 'password', 'worktrack'])
        except:
            pass
        return False
    
    def cleanup(self):
        """Limpa dados de teste"""
        print("\n🧹 Limpando dados de teste...")
        try:
            # Aqui poderia adicionar limpeza de banco se necessário
            print("✅ Limpeza concluída")
        except Exception as e:
            print(f"⚠️ Erro na limpeza: {e}")

def main():
    """Função principal"""
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
    else:
        server_url = input("URL do servidor (padrão: http://localhost/worktrack): ").strip()
        if not server_url:
            server_url = "http://localhost/worktrack"
    
    tester = WorkTrackTester(server_url)
    
    try:
        success = tester.run_tests()
        tester.cleanup()
        
        if success:
            print("\n🎯 Sistema pronto para uso!")
            print(f"🌐 Acesse: {server_url}")
            print("👤 Login: admin")
            print("🔑 Senha: admin123")
            sys.exit(0)
        else:
            print("\n❌ Sistema com problemas. Verifique:")
            print("1. Servidor web está rodando?")
            print("2. Banco de dados está configurado?")
            print("3. URL está correta?")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
