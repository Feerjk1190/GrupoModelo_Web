<?php

// Verificar que el usuario sea administrador
require_once __DIR__ . "/verificar_admin.php";

require_once __DIR__ . "/conexion.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Método no permitido."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    $sql = "SELECT
                id_mensaje,
                nombre,
                correo,
                asunto,
                mensaje,
                fecha_envio,
                estatus
            FROM mensajes_contacto
            ORDER BY fecha_envio DESC, id_mensaje DESC";

    $consulta = $conexion->query($sql);

    // guardar todos los mensajes encontrados (arreglo)
    $mensajes = $consulta->fetchAll(PDO::FETCH_ASSOC);

    $total = count($mensajes);
    $pendientes = 0;
    $respondidos = 0;
    $otros = 0;

    foreach ($mensajes as $mensaje) {

        if ($mensaje["estatus"] === "Pendiente") {

            $pendientes++;

        } elseif ($mensaje["estatus"] === "Respondido") {

            $respondidos++;

        } else {

            $otros++;
        }
    }

    echo json_encode([
        "exito" => true,

        "mensajes" => $mensajes,

        "resumen" => [
            "total" => $total,
            "pendientes" => $pendientes,
            "respondidos" => $respondidos,
            "otros" => $otros
        ]

    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No se pudieron consultar los mensajes."
    ], JSON_UNESCAPED_UNICODE);
}
