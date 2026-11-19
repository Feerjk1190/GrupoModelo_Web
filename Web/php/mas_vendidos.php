<?php
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    echo json_encode(["exito" => false, "mensaje" => "Método no permitido"]);
    exit;
}

require_once __DIR__ . "/conexion.php";

try {
    $sql = "SELECT p.id_web, SUM(d.cantidad) AS vendidos
            FROM detalles_pedidos d
            INNER JOIN pedidos pe ON pe.id_pedido = d.id_pedido
            INNER JOIN productos p ON p.id_producto = d.id_producto
            WHERE p.id_web IS NOT NULL
              AND pe.estatus_pedido <> 'Cancelado'
            GROUP BY p.id_web
            ORDER BY vendidos DESC, p.id_web ASC
            LIMIT 8";

    $consulta = $conexion->query($sql);
    $ids = array_map('intval', $consulta->fetchAll(PDO::FETCH_COLUMN));
    echo json_encode(["exito" => true, "ids" => $ids]);
} catch (PDOException $error) {
    error_log($error->getMessage());
    http_response_code(500);
    echo json_encode(["exito" => false, "mensaje" => "No se pudieron consultar las ventas."]);
}
