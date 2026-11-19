
<?php

// =====================================
// OBTENER DATOS DE ENTREGA - GRUPO MODELO
// =====================================

header("Content-Type: application/json; charset=utf-8");

session_start();

function responder($datos, $codigo = 200) {
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Verificar la sesión
if (empty($_SESSION["id_usuario"])) {
    responder([
        "exito" => false,
        "mensaje" => "Debes iniciar sesión."
    ], 401);
}

// Conexión a MySQL
require_once __DIR__ . "/conexion.php";

try {

    $consulta = $conexion->prepare("
        SELECT
            nombre,
            telefono,
            codigo_postal,
            direccion,
            referencias
        FROM direcciones_entrega
        WHERE id_usuario = :id_usuario
        LIMIT 1
    ");

    $consulta->execute([
        ":id_usuario" => (int) $_SESSION["id_usuario"]
    ]);

    $entrega = $consulta->fetch(PDO::FETCH_ASSOC);

    responder([
        "exito" => true,
        "encontrado" => (bool) $entrega,
        "entrega" => $entrega ?: null
    ]);

} catch (Throwable $error) {

    error_log($error->getMessage());

    responder([
        "exito" => false,
        "mensaje" => "No se pudieron consultar los datos de entrega."
    ], 500);
}
