
<?php

// PEDIDOS DEL REPARTIDOR POR ESTADO

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once "autenticar_repartidor.php";

// Recibir estado
$estatus = $_GET["estatus"] ?? "";

// Comprobar estado permitido
if ($estatus != "En Camino" && $estatus != "Entregado") {

    http_response_code(400);

    echo json_encode([
        "status" => "error",
        "message" => "Estado incorrecto"
    ]);

    exit;
}

// Consultar únicamente sus pedidos
$sql = "SELECT
            id_pedido,
            cliente,
            telefono,
            direccion,
            codigo_postal,
            referencias,
            fecha_pedido,
            total,
            CASE
                WHEN estatus_pedido = 'En camino'
                THEN 'En Camino'
                ELSE estatus_pedido
            END AS estatus_pedido
        FROM pedidos
        WHERE id_repartidor = ?
        AND LOWER(TRIM(estatus_pedido)) = LOWER(?)
        ORDER BY fecha_pedido DESC";

$consulta = $conexion->prepare($sql);

$consulta->execute([
    $idRepartidorActual,
    $estatus
]);

$pedidos = $consulta->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(
    $pedidos,
    JSON_UNESCAPED_UNICODE
);

?>
