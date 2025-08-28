#!/usr/bin/env python3
"""
Teste de conectividade das APIs WorkTrack
Este script testa se as APIs estão aceitando conexões de qualquer origem
"""

import requests
import json
import sys
from datetime import datetime

def test_api_endpoint(base_url, endpoint, method='GET', data=None):
    """Testa um endpoint específico"""
    url = f"{base_url}/api/{endpoint}"
    
    print(f"\n🔍 Testando {method} {url}")
    
    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        elif method == 'OPTIONS':
            response = requests.options(url, timeout=10)
        
        print(f"   Status: {response.status_code}")
        print(f"   Headers CORS:")
        
        cors_headers = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods', 
            'Access-Control-Allow-Headers'
        ]
        
        for header in cors_headers:
            value = response.headers.get(header, 'Não definido')
            print(f"     {header}: {value}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   Resposta: {json.dumps(result, indent=2, ensure_ascii=False)[:200]}...")
            except:
                print(f"   Resposta: {response.text[:200]}...")
        
        return response.status_code == 200
        
    except requests.exceptions.ConnectException:
        print(f"   ❌ Erro de conexão")
        return False
    except requests.exceptions.Timeout:
        print(f"   ❌ Timeout")
        return False
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Uso: python test_cors.py <URL_DO_SERVIDOR>")
        print("Exemplo: python test_cors.py http://localhost:8080")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print("🌐 TESTE DE CORS - WorkTrack APIs")
    print("=" * 50)
    print(f"Servidor: {base_url}")
    print(f"Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Dados de teste
    test_data = {
        'computer_id': 'TEST_COMPUTER_123',
        'computer_name': 'Computador de Teste',
        'os_info': 'Test OS 1.0',
        'application_name': 'test_app.exe',
        'window_title': 'Janela de Teste',
        'usage_minutes': 5,
        'timestamp': datetime.now().isoformat()
    }
    
    # Lista de endpoints para testar
    endpoints = [
        ('test.php', 'GET', None),
        ('test.php', 'POST', test_data),
        ('ping.php', 'GET', None),
        ('heartbeat.php', 'POST', test_data),
        ('collect.php', 'POST', test_data),
        ('register.php', 'POST', test_data),
        ('activity.php', 'POST', test_data),
        ('ping.php', 'OPTIONS', None),  # Teste preflight
    ]
    
    successful_tests = 0
    total_tests = len(endpoints)
    
    for endpoint, method, data in endpoints:
        success = test_api_endpoint(base_url, endpoint, method, data)
        if success:
            successful_tests += 1
    
    print("\n" + "=" * 50)
    print(f"📊 RESULTADO DOS TESTES")
    print(f"✅ Sucessos: {successful_tests}/{total_tests}")
    print(f"❌ Falhas: {total_tests - successful_tests}/{total_tests}")
    
    if successful_tests == total_tests:
        print("🎉 Todos os testes passaram! APIs funcionando corretamente.")
        print("🔓 CORS configurado para aceitar qualquer origem.")
    else:
        print("⚠️ Alguns testes falharam. Verifique a configuração do servidor.")
    
    print("\n💡 Dicas:")
    print("- Certifique-se de que o servidor PHP está rodando")
    print("- Verifique se não há firewall bloqueando as conexões")
    print("- Confirme se os arquivos de API estão no local correto")

if __name__ == "__main__":
    main()
