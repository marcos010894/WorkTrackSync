#!/usr/bin/env node

/**
 * Script para configurar o banco de dados MySQL
 * Executa as tabelas e configurações iniciais
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuração do banco
const dbConfig = {
    host: '193.203.175.53',
    port: 3306,
    user: 'u441041902_interact_workt',
    password: 'Mito010894',
    database: 'u441041902_interact_workt',
    multipleStatements: true
};

async function setupDatabase() {
    console.log('🔧 Configurando banco de dados MySQL...');

    try {
        // Conectar ao MySQL
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao MySQL');

        // Ler arquivo de schema
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Executar schema
        console.log('📋 Executando schema do banco...');
        await connection.query(schema);
        console.log('✅ Schema executado com sucesso');

        // Verificar tabelas criadas
        const [tables] = await connection.query('SHOW TABLES FROM u441041902_interact_workt');
        console.log('📊 Tabelas criadas:');
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });

        // Inserir dados de exemplo (opcional)
        const insertSampleData = process.argv.includes('--sample-data');
        if (insertSampleData) {
            console.log('🔄 Inserindo dados de exemplo...');
            await insertSampleDataIntoTables(connection);
        }

        await connection.end();
        console.log('✅ Configuração do banco concluída!');

    } catch (error) {
        console.error('❌ Erro na configuração do banco:', error.message);
        process.exit(1);
    }
}

async function insertSampleDataIntoTables(connection) {
    const sampleQueries = [
        `INSERT INTO devices (id, name, user_name, os_info) VALUES 
         ('sample-001', 'Computador Exemplo', 'Usuario Teste', 'Windows 11 Pro')
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,

        `INSERT INTO daily_history (date, device_id, device_name, total_activities, total_minutes) VALUES 
         (CURDATE(), 'sample-001', 'Computador Exemplo', 5, 120)
         ON DUPLICATE KEY UPDATE total_activities = VALUES(total_activities)`
    ];

    for (const query of sampleQueries) {
        await connection.query(query);
    }

    console.log('✅ Dados de exemplo inseridos');
}

// Função para testar conexão
async function testConnection() {
    console.log('🔍 Testando conexão com o banco...');

    try {
        const connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.query('SELECT 1 as test');
        await connection.end();

        console.log('✅ Conexão testada com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
        return false;
    }
} // CLI Interface
const command = process.argv[2];

switch (command) {
    case 'setup':
        setupDatabase();
        break;
    case 'test':
        testConnection();
        break;
    default:
        console.log(`
🗄️  WorkTrackSync - Configurador MySQL

Comandos disponíveis:
  node setup-db.js setup          - Configurar banco de dados completo
  node setup-db.js setup --sample-data - Configurar com dados de exemplo
  node setup-db.js test           - Testar conexão com banco

Variáveis de ambiente necessárias:
  MYSQL_HOST      - Host do MySQL (padrão: localhost)
  MYSQL_PORT      - Porta do MySQL (padrão: 3306)
  MYSQL_USER      - Usuário do MySQL (padrão: root)
  MYSQL_PASSWORD  - Senha do MySQL
  MYSQL_DATABASE  - Nome do banco (será criado automaticamente)

Exemplo:
  MYSQL_PASSWORD=minhasenha node setup-db.js setup
        `);
        break;
}