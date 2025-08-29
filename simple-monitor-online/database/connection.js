/**
 * Configuração de conexão MySQL para WorkTrackSync
 * Sistema de persistência de dados para monitoramento
 */

const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
    host: '193.203.175.53',
    port: 3306,
    user: 'u441041902_interact_workt',
    password: 'Mito010894',
    database: 'u441041902_interact_workt',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
    charset: 'utf8mb4'
};

// Pool de conexões
let pool = null;

/**
 * Inicializa o pool de conexões MySQL
 */
function initializePool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
        console.log('✅ Pool de conexões MySQL inicializado');
    }
    return pool;
}

/**
 * Obtém uma conexão do pool
 */
async function getConnection() {
    if (!pool) {
        initializePool();
    }

    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error('❌ Erro ao obter conexão MySQL:', error);
        throw error;
    }
}

/**
 * Executa uma query com parâmetros
 */
async function executeQuery(query, params = []) {
    let connection;

    try {
        connection = await getConnection();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('❌ Erro ao executar query:', error);
        console.error('Query:', query);
        console.error('Params:', params);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Executa múltiplas queries em uma transação
 */
async function executeTransaction(queries) {
    let connection;

    try {
        connection = await getConnection();
        await connection.beginTransaction();

        const results = [];
        for (const { query, params }
            of queries) {
            const [result] = await connection.execute(query, params || []);
            results.push(result);
        }

        await connection.commit();
        return results;
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('❌ Erro na transação:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Testa a conexão com o banco
 */
async function testConnection() {
    try {
        const result = await executeQuery('SELECT 1 as test');
        console.log('✅ Conexão MySQL testada com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Falha no teste de conexão MySQL:', error);
        return false;
    }
}

/**
 * Fecha o pool de conexões
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('✅ Pool de conexões MySQL fechado');
    }
}

module.exports = {
    initializePool,
    getConnection,
    executeQuery,
    executeTransaction,
    testConnection,
    closePool
};