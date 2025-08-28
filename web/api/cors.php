<?php
/**
 * Configurações CORS para APIs
 * Inclua este arquivo em todas as APIs para permitir acesso de qualquer origem
 */

// Configurar cabeçalhos CORS para permitir acesso de qualquer origem
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Computer-ID, X-Requested-With');
header('Access-Control-Allow-Credentials: false');
header('Access-Control-Max-Age: 86400'); // Cache preflight por 24 horas

// Responder a requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Configurar Content-Type padrão
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}
