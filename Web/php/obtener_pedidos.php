
<?php

// GRUPO MODELO
// CONSULTAR PEDIDOS PENDIENTES

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

// Comprobar que el repartidor inició sesión
require_once "autenticar_repartidor.php";

try {

    // Buscar pedidos disponibles
    $sql = "SELECT
                id_pedido,
                cliente,
                telefono,
                direccion,
                codigo_postal,
                referencias,
                fecha_pedido,
                total,
                estatus_pedido
            FROM pedidos
            WHERE estatus_pedido = 'Pendiente'
            AND id_repartidor IS NULL
            ORDER BY fecha_pedido ASC, id_pedido ASC";

    $consulta = $conexion->prepare($sql);

    $consulta->execute();

    $pedidos = $consulta->fetchAll(PDO::FETCH_ASSOC);

    // Enviar pedidos a Android
    echo json_encode(
        $pedidos,
        JSON_UNESCAPED_UNICODE
    );

} catch (PDOException $error) {

    // Guardar error en el registro de PHP
    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Error al consultar pedidos"
    ]);
}

?>
