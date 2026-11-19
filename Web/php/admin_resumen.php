
<?php

require_once __DIR__ . "/verificar_admin.php";
require_once __DIR__ . "/conexion.php";

try {

    // Pedidos pendientes
    $consulta = $conexion->query("
        SELECT COUNT(*)
        FROM pedidos
        WHERE estatus_pedido = 'Pendiente'
    ");

    $pendientes = (int) $consulta->fetchColumn();

    // Productos registrados
    $consulta = $conexion->query("
        SELECT COUNT(*)
        FROM productos
        WHERE id_web IS NOT NULL
    ");

    $productos = (int) $consulta->fetchColumn();

    // Mensajes pendientes
    $consulta = $conexion->query("
        SELECT COUNT(*)
        FROM mensajes_contacto
        WHERE estatus = 'Pendiente'
    ");

    $mensajes = (int) $consulta->fetchColumn();

    // Ventas registradas
    $consulta = $conexion->query("
        SELECT COALESCE(SUM(total), 0)
        FROM pedidos
        WHERE estatus_pedido <> 'Cancelado'
    ");

    $ventas = (float) $consulta->fetchColumn();

    echo json_encode([
        "exito" => true,
        "pendientes" => $pendientes,
        "productos" => $productos,
        "mensajes" => $mensajes,
        "ventas" => $ventas
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No se pudieron consultar las estadísticas."
    ], JSON_UNESCAPED_UNICODE);
}
