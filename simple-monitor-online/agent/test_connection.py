#!/usr/bin/env python3
"""
Teste de conexão com o servidor online
"""

import requests
import json
import platform
import os
from datetime import datetime

def test_connection():
    server_url = "https://simple-monitor-online-eqh2p2ir4-marcos10895s-projects.vercel.app"
    
    print("🧪 TESTE DE CONEXÃO")
    print("=" * 40)
    print(f"🌐 Servidor: {server_url}")
    
    # Teste 1: Registro
    print("\n📝 Testando registro...")
    try:
        data = {
            'type': 'register',
            'computer_id': f'test-{platform.node()}',
            'computer_name': platform.node(),
            'user_name': os.environ.get('USER', 'test-user'),
            'os_info': f"{platform.system()} {platform.release()}"
        }
        
        response = requests.post(f'{server_url}/api/data', json=data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Registro OK!")
        else:
            print("❌ Erro no registro")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Teste 2: Atividade
    print("\n📊 Testando envio de atividade...")
    try:
        data = {
            'type': 'activity',
            'computer_id': f'test-{platform.node()}',
            'total_minutes': 5,
            'current_activity': 'Testando Sistema',
            'active_window': 'Terminal',
            'timestamp': datetime.now().isoformat()
        }
        
        response = requests.post(f'{server_url}/api/data', json=data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Atividade OK!")
        else:
            print("❌ Erro na atividade")
            
    except Exception as e:
        print(f"❌ Erro: {e}")
    
    # Teste 3: Verificar comandos
    print("\n🎮 Testando verificação de comandos...")
    try:
        response = requests.get(f'{server_url}/api/commands', 
                              params={'computer_id': f'test-{platform.node()}'}, 
                              timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Comandos OK!")
        else:
            print("❌ Erro nos comandos")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_connection()
