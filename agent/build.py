# WorkTrackSync Agent - Build Script
# Gera executáveis para diferentes plataformas

import os
import sys
import subprocess
import platform
from pathlib import Path

def build_agent():
    """Gera executável do agente"""
    
    print("🔨 WorkTrackSync Agent - Build Script")
    print("=" * 40)
    
    # Verificar se PyInstaller está instalado
    try:
        import PyInstaller
        print("✅ PyInstaller encontrado")
    except ImportError:
        print("❌ PyInstaller não encontrado. Instalando...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])
    
    # Diretório atual
    current_dir = Path(__file__).parent
    os.chdir(current_dir)
    
    # Nome do sistema
    system_name = platform.system().lower()
    arch = platform.machine().lower()
    
    # Configurações específicas por plataforma
    if system_name == "windows":
        output_name = f"worktrack-agent-windows-{arch}.exe"
        icon_param = "--icon=worktrack.ico" if Path("worktrack.ico").exists() else ""
    elif system_name == "darwin":  # macOS
        output_name = f"worktrack-agent-macos-{arch}"
        icon_param = "--icon=worktrack.icns" if Path("worktrack.icns").exists() else ""
    else:  # Linux
        output_name = f"worktrack-agent-linux-{arch}"
        icon_param = ""
    
    # Comando PyInstaller
    cmd = [
        "pyinstaller",
        "--onefile",
        "--windowed" if system_name == "windows" else "--console",
        "--name", output_name,
        "--distpath", "dist",
        "--workpath", "build",
        "--specpath", "build",
        "--add-data", "config.json;.",
    ]
    
    if icon_param:
        cmd.append(icon_param)
    
    cmd.append("worktrack_agent.py")
    
    print(f"🏗️ Compilando para {system_name} ({arch})...")
    print(f"📦 Arquivo de saída: {output_name}")
    
    try:
        subprocess.check_call(cmd)
        print("✅ Compilação concluída com sucesso!")
        
        # Copiar arquivos adicionais
        dist_dir = Path("dist")
        
        # Copiar config.json
        if Path("config.json").exists():
            import shutil
            shutil.copy2("config.json", dist_dir / "config.json")
            print("✅ config.json copiado")
        
        # Criar README para distribuição
        readme_content = f"""
WorkTrack Agent - {system_name.title()}

INSTALAÇÃO:
1. Execute o arquivo {output_name}
2. Configure a URL do servidor quando solicitado
3. O agente será instalado automaticamente

CONFIGURAÇÃO:
- Edite config.json para ajustar configurações
- URL padrão do servidor: http://localhost/worktrack/api

SUPORTE:
- Documentação: README.md
- Logs: worktrack_agent.log
"""
        
        with open(dist_dir / "README.txt", "w", encoding="utf-8") as f:
            f.write(readme_content.strip())
        
        print("✅ README.txt criado")
        
        # Mostrar arquivos gerados
        print("\n📁 Arquivos gerados:")
        for file in dist_dir.iterdir():
            if file.is_file():
                size = file.stat().st_size / 1024 / 1024  # MB
                print(f"   {file.name} ({size:.1f} MB)")
        
        print(f"\n🎉 Build concluído! Arquivos em: {dist_dir.absolute()}")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro na compilação: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)

def create_installer():
    """Cria instalador com NSIS (Windows)"""
    
    if platform.system() != "Windows":
        print("⚠️ Instalador NSIS disponível apenas no Windows")
        return
    
    # Verificar se NSIS está disponível
    try:
        subprocess.check_call(["makensis", "/VERSION"], 
                            stdout=subprocess.DEVNULL, 
                            stderr=subprocess.DEVNULL)
        print("✅ NSIS encontrado")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ NSIS não encontrado. Baixe em: https://nsis.sourceforge.io/")
        return
    
    # Criar script NSIS
    nsis_script = '''
!define APP_NAME "WorkTrack Agent"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "WorkTrack"
!define APP_EXECUTABLE "worktrack-agent-windows-{arch}.exe"

Name "${APP_NAME}"
OutFile "WorkTrack-Agent-Installer.exe"
InstallDir "$PROGRAMFILES\\WorkTrack"
RequestExecutionLevel admin

Page directory
Page instfiles

Section "Install"
    SetOutPath $INSTDIR
    File "dist\\${APP_EXECUTABLE}"
    File "dist\\config.json"
    File "dist\\README.txt"
    
    WriteUninstaller "$INSTDIR\\uninstall.exe"
    
    CreateDirectory "$SMPROGRAMS\\WorkTrack"
    CreateShortCut "$SMPROGRAMS\\WorkTrack\\WorkTrack Agent.lnk" "$INSTDIR\\${APP_EXECUTABLE}"
    CreateShortCut "$SMPROGRAMS\\WorkTrack\\Uninstall.lnk" "$INSTDIR\\uninstall.exe"
SectionEnd

Section "Uninstall"
    Delete "$INSTDIR\\${APP_EXECUTABLE}"
    Delete "$INSTDIR\\config.json"
    Delete "$INSTDIR\\README.txt"
    Delete "$INSTDIR\\uninstall.exe"
    RMDir "$INSTDIR"
    
    Delete "$SMPROGRAMS\\WorkTrack\\WorkTrack Agent.lnk"
    Delete "$SMPROGRAMS\\WorkTrack\\Uninstall.lnk"
    RMDir "$SMPROGRAMS\\WorkTrack"
SectionEnd
'''.format(arch=platform.machine().lower())
    
    with open("installer.nsi", "w") as f:
        f.write(nsis_script)
    
    try:
        subprocess.check_call(["makensis", "installer.nsi"])
        print("✅ Instalador criado: WorkTrack-Agent-Installer.exe")
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao criar instalador: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--installer":
        create_installer()
    else:
        build_agent()
        
        # Criar instalador no Windows
        if platform.system() == "Windows":
            create_installer()
