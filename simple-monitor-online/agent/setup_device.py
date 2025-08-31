#!/usr/bin/env python3
"""
Script de Configuração do Dispositivo
Cria arquivo device_config.json com informações personalizadas
"""

import json
import os
import platform

def get_default_device_name():
    """Gerar nome padrão baseado no sistema"""
    try:
        if platform.system() == "Windows":
            computer_name = os.environ.get('COMPUTERNAME', 'PC-Desconhecido')
            return f"{computer_name} - Windows"
        elif platform.system() == "Darwin":
            return f"{platform.node()} - macOS"
        else:
            return f"{platform.node()} - {platform.system()}"
    except:
        return "Computador Desconhecido"

def get_default_user_name():
    """Gerar nome de usuário padrão"""
    try:
        if platform.system() == "Windows":
            return os.environ.get('USERNAME', 'Usuario')
        else:
            return os.environ.get('USER', 'Usuario')
    except:
        return "Usuario"

def main():
    print("🔧 Configuração do Dispositivo para WorkTrackSync")
    print("=" * 50)
    
    # Verificar se já existe configuração
    config_file = os.path.join(os.path.dirname(__file__), 'device_config.json')
    if os.path.exists(config_file):
        print(f"⚠️ Arquivo de configuração já existe: {config_file}")
        overwrite = input("Deseja sobrescrever? (s/N): ").lower().strip()
        if overwrite not in ['s', 'sim', 'y', 'yes']:
            print("❌ Configuração cancelada.")
            return
    
    print("\\n📝 Vamos configurar seu dispositivo:")
    
    # Nome do dispositivo
    default_device = get_default_device_name()
    device_name = input(f"Nome do dispositivo [{default_device}]: ").strip()
    if not device_name:
        device_name = default_device
    
    # Nome do usuário
    default_user = get_default_user_name()
    user_name = input(f"Nome do usuário [{default_user}]: ").strip()
    if not user_name:
        user_name = default_user
    
    # Descrição (opcional)
    description = input("Descrição do dispositivo (opcional): ").strip()
    
    # Departamento (opcional)
    department = input("Departamento (opcional): ").strip()
    
    # Localização (opcional)
    location = input("Localização (opcional): ").strip()
    
    # Tags (opcional)
    tags_input = input("Tags (separadas por vírgula, opcional): ").strip()
    tags = [tag.strip() for tag in tags_input.split(',') if tag.strip()] if tags_input else []
    
    # Criar configuração
    config = {
        "device_name": device_name,
        "user_name": user_name
    }
    
    if description:
        config["description"] = description
    
    if department:
        config["department"] = department
        
    if location:
        config["location"] = location
        
    if tags:
        config["tags"] = tags
    
    # Salvar configuração
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        print("\\n✅ Configuração salva com sucesso!")
        print(f"📁 Arquivo: {config_file}")
        print("\\n📋 Configuração criada:")
        print(json.dumps(config, indent=2, ensure_ascii=False))
        
        print("\\n🚀 Agora você pode executar o monitor com:")
        print("python3 monitor_online.py")
        
    except Exception as e:
        print(f"❌ Erro ao salvar configuração: {e}")

if __name__ == "__main__":
    main()
