#!/usr/bin/env python3
"""
Desinstalador do WorkTrack Monitor
Remove completamente o monitor do sistema
"""

import os
import sys
import platform
import subprocess
import shutil
from pathlib import Path

def uninstall_monitor():
    """Desinstalar o monitor completamente"""
    print("🗑️ Desinstalando WorkTrack Monitor...")
    
    home_dir = Path.home()
    install_dir = home_dir / ".worktrack_monitor"
    system = platform.system()
    
    try:
        # 1. Parar e remover serviços
        if system == "Darwin":  # macOS
            # Parar LaunchAgent
            subprocess.run(['launchctl', 'stop', 'com.worktrack.monitor'], 
                          capture_output=True)
            subprocess.run(['launchctl', 'unload', 
                          str(home_dir / "Library" / "LaunchAgents" / "com.worktrack.monitor.plist")], 
                          capture_output=True)
            
            # Remover arquivo plist
            plist_file = home_dir / "Library" / "LaunchAgents" / "com.worktrack.monitor.plist"
            if plist_file.exists():
                plist_file.unlink()
                print("🚫 LaunchAgent removido")
            
        elif system == "Windows":  # Windows
            try:
                import winreg
                key_path = r"Software\\Microsoft\\Windows\\CurrentVersion\\Run"
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
                winreg.DeleteValue(key, "WorkTrackMonitor")
                winreg.CloseKey(key)
                print("🚫 Registro removido")
            except:
                print("⚠️ Entrada do registro não encontrada")
            
            # Tentar matar processo
            try:
                subprocess.run(['taskkill', '/f', '/im', 'python.exe'], capture_output=True)
            except:
                pass
        
        # 2. Remover diretório de instalação
        if install_dir.exists():
            shutil.rmtree(install_dir)
            print("📁 Diretório removido")
        
        # 3. Tentar matar processos Python relacionados (cuidadosamente)
        try:
            if system != "Windows":  # Unix-like
                # Buscar processos do monitor
                result = subprocess.run(['pgrep', '-f', 'worktrack'], capture_output=True, text=True)
                if result.stdout.strip():
                    pids = result.stdout.strip().split('\\n')
                    for pid in pids:
                        try:
                            subprocess.run(['kill', pid], capture_output=True)
                        except:
                            pass
                    print("🔄 Processos finalizados")
        except:
            pass
        
        print("\\n✅ Desinstalação concluída!")
        print("🧹 Todos os componentes removidos")
        print("🔒 Monitor não está mais ativo")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na desinstalação: {e}")
        return False

def check_monitor_status():
    """Verificar se o monitor está rodando"""
    print("🔍 Verificando status do monitor...")
    
    home_dir = Path.home()
    install_dir = home_dir / ".worktrack_monitor"
    system = platform.system()
    
    status = {
        'installed': install_dir.exists(),
        'autostart': False,
        'running': False
    }
    
    # Verificar autostart
    if system == "Darwin":
        plist_file = home_dir / "Library" / "LaunchAgents" / "com.worktrack.monitor.plist"
        status['autostart'] = plist_file.exists()
    elif system == "Windows":
        try:
            import winreg
            key_path = r"Software\\Microsoft\\Windows\\CurrentVersion\\Run"
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_READ)
            try:
                winreg.QueryValueEx(key, "WorkTrackMonitor")
                status['autostart'] = True
            except:
                pass
            winreg.CloseKey(key)
        except:
            pass
    
    # Verificar se está rodando
    try:
        if system != "Windows":
            result = subprocess.run(['pgrep', '-f', 'worktrack'], capture_output=True, text=True)
            status['running'] = bool(result.stdout.strip())
    except:
        pass
    
    print(f"📁 Instalado: {'✅' if status['installed'] else '❌'}")
    print(f"🚀 Autostart: {'✅' if status['autostart'] else '❌'}")
    print(f"▶️ Rodando: {'✅' if status['running'] else '❌'}")
    
    return status

def main():
    print("🗑️ WorkTrack Monitor - Desinstalador")
    print("=" * 40)
    
    # Verificar status atual
    status = check_monitor_status()
    
    if not any(status.values()):
        print("\\n💭 O monitor não parece estar instalado.")
        return
    
    print("\\n⚠️ Isso irá remover completamente o WorkTrack Monitor!")
    print("- Parar todos os processos")
    print("- Remover autostart")
    print("- Deletar todos os arquivos")
    
    confirm = input("\\n❓ Continuar? (s/N): ").strip().lower()
    
    if confirm in ['s', 'sim', 'y', 'yes']:
        if uninstall_monitor():
            print("\\n🎉 Monitor desinstalado com sucesso!")
        else:
            print("\\n❌ Falha na desinstalação!")
            sys.exit(1)
    else:
        print("\\n🚫 Desinstalação cancelada.")

if __name__ == "__main__":
    main()
