<?php

require_once __DIR__ . "/verificar_admin.php";
require_once __DIR__ . "/conexion.php";

try {

    // Consultar los pedidos registrados en MySQL
    $sql = "SELECT
                id_pedido,
                cliente,
                fecha_pedido,
                total,
                estatus_pedido
            FROM pedidos
            ORDER BY id_pedido DESC";

    // Ejecutar la consulta
    $consulta = $conexion->query($sql);

    // ARREGLOS: guardar todos los pedidos encontrados
    $pedidos = $consulta->fetchAll(PDO::FETCH_ASSOC);

    // Enviar los pedidos a JavaScript
    echo json_encode([
        "exito" => true,
        "pedidos" => $pedidos
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No se pudieron consultar los pedidos."
    ], JSON_UNESCAPED_UNICODE);
}
