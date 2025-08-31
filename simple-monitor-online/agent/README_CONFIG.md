# Configuração Personalizada de Dispositivos

## Como usar nomes personalizados para seus dispositivos

### Método 1: Script de Configuração (Recomendado)

1. Execute o script de configuração:
```bash
cd agent
python3 setup_device.py
```

2. Siga as instruções para configurar:
   - Nome do dispositivo
   - Nome do usuário
   - Descrição (opcional)
   - Departamento (opcional)
   - Localização (opcional)
   - Tags (opcional)

3. Execute o monitor:
```bash
python3 monitor_online.py
```

### Método 2: Arquivo Manual

1. Crie o arquivo `device_config.json` na pasta `agent`:

```json
{
  "device_name": "MacBook Pro - Escritório",
  "user_name": "Marcos Paulo",
  "description": "Computador principal do escritório",
  "department": "Desenvolvimento",
  "location": "São Paulo",
  "tags": ["desenvolvimento", "principal", "escritorio"]
}
```

2. Execute o monitor:
```bash
python3 monitor_online.py
```

## Campos de Configuração

### Obrigatórios
- `device_name`: Nome personalizado para o dispositivo
- `user_name`: Nome personalizado para o usuário

### Opcionais
- `description`: Descrição detalhada do dispositivo
- `department`: Departamento ou setor
- `location`: Localização física
- `tags`: Array de tags para categorização

## Exemplos de Configuração

### Configuração Mínima
```json
{
  "device_name": "MacBook Pro",
  "user_name": "João Silva"
}
```

### Configuração Completa
```json
{
  "device_name": "Desktop-Desenvolvimento-01",
  "user_name": "Maria Santos",
  "description": "Estação de trabalho principal do time de desenvolvimento",
  "department": "TI - Desenvolvimento",
  "location": "São Paulo - Sala 201",
  "tags": ["desenvolvimento", "frontend", "principal"]
}
```

### Múltiplos Dispositivos

Para configurar múltiplos dispositivos, crie um arquivo `device_config.json` em cada pasta do agente com configurações específicas.

## Verificação

Quando o monitor iniciar, você verá mensagens como:
```
✅ Configuração carregada: /path/to/device_config.json
📝 Usando nome personalizado: MacBook Pro - Escritório
👤 Usando usuário personalizado: Marcos Paulo
🖥️ Monitor Online iniciado
💻 Computador: MacBook Pro - Escritório
👤 Usuário: Marcos Paulo
```

## Estrutura de Arquivos

```
agent/
├── monitor_online.py       # Monitor principal
├── setup_device.py         # Script de configuração
├── device_config.json      # Configuração personalizada
└── README_CONFIG.md        # Este arquivo
```

## Solução de Problemas

### O arquivo de configuração não está sendo carregado
- Verifique se o arquivo `device_config.json` está na mesma pasta que `monitor_online.py`
- Verifique se o JSON está válido (use um validador online)
- Verifique as permissões de leitura do arquivo

### O nome personalizado não aparece no dashboard
- Aguarde alguns minutos para sincronização
- Verifique se o monitor está enviando dados corretamente
- Reinicie o monitor se necessário

### JSON inválido
Se houver erro no JSON, o monitor usará os nomes padrão do sistema. Exemplo de JSON válido:
```json
{
  "device_name": "Meu Computador",
  "user_name": "Meu Nome"
}
```

## Migração de Dispositivos Existentes

Se você já tem dispositivos registrados com nomes genéricos:

1. Configure o `device_config.json` 
2. Reinicie o monitor
3. O sistema atualizará automaticamente as informações do dispositivo

Os dados históricos serão mantidos, apenas o nome será atualizado.
