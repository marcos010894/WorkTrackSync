#!/usr/bin/env python3
"""
Teste básico do WorkTrack Agent
Verifica se o agente consegue ser carregado sem erros
"""

import sys
import os

def test_agent_import():
    """Testa se o agente pode ser importado sem erros"""
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'agent'))
        from worktrack_agent import WorkTrackAgent
        print("✅ WorkTrackAgent importado com sucesso")
        return True
    except SyntaxError as e:
        print(f"❌ Erro de sintaxe no agente: {e}")
        return False
    except ImportError as e:
        print(f"❌ Erro de importação: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        return False

def test_agent_creation():
    """Testa se o agente pode ser criado"""
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'agent'))
        from worktrack_agent import WorkTrackAgent
        
        # Configuração básica para teste
        config = {
            'server_url': 'https://worktracksync.online/api',
            'heartbeat_interval': 60,
            'enable_remote_commands': False
        }
        
        agent = WorkTrackAgent(config)
        print("✅ WorkTrackAgent criado com sucesso")
        print(f"🆔 Computer ID: {agent.computer_id}")
        return True
    except Exception as e:
        print(f"❌ Erro ao criar agente: {e}")
        return False

def main():
    print("🧪 TESTE DO WORKTRACK AGENT")
    print("=" * 40)
    
    tests = [
        ("Importação do módulo", test_agent_import),
        ("Criação do agente", test_agent_creation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name}...")
        if test_func():
            passed += 1
        
    print("\n" + "=" * 40)
    print(f"📊 RESULTADO: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram! O agente está funcionando.")
        return 0
    else:
        print("⚠️ Alguns testes falharam. Verifique os erros acima.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
