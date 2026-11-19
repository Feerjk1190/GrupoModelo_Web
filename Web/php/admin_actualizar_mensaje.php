<?php

require_once __DIR__ . "/verificar_admin.php";

require_once __DIR__ . "/conexion.php";

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Método no permitido."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$datos = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($datos)) {

    http_response_code(400);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Datos incorrectos."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$idMensaje = filter_var(
    $datos["id_mensaje"] ?? null,
    FILTER_VALIDATE_INT
);

if (!$idMensaje || $idMensaje < 1) {

    http_response_code(400);

    echo json_encode([
        "exito" => false,
        "mensaje" => "ID del mensaje incorrecto."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    // Buscar el mensaje en la base de datos
    $consulta = $conexion->prepare(
        "SELECT id_mensaje, estatus
         FROM mensajes_contacto
         WHERE id_mensaje = ?"
    );

    $consulta->execute([$idMensaje]);

    $mensaje = $consulta->fetch(PDO::FETCH_ASSOC);

    // Comprobar que el mensaje exista
    if (!$mensaje) {

        http_response_code(404);

        echo json_encode([
            "exito" => false,
            "mensaje" => "No se encontró el mensaje."
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    // Revisar si ya fue respondido
    if ($mensaje["estatus"] === "Respondido") {

        echo json_encode([
            "exito" => true,
            "mensaje" => "Este mensaje ya estaba respondido."
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    // Actualizar el estado del mensaje en MySQL
    $actualizar = $conexion->prepare(
        "UPDATE mensajes_contacto
         SET estatus = 'Respondido'
         WHERE id_mensaje = ?"
    );

    $actualizar->execute([$idMensaje]);

    // Confirmar que se realizó la actualización
    echo json_encode([
        "exito" => true,
        "mensaje" => "Mensaje marcado como respondido."
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No se pudo actualizar el mensaje."
    ], JSON_UNESCAPED_UNICODE);
}
