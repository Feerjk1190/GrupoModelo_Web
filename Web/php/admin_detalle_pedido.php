
<?php

// GRUPO MODELO
// CONSULTAR DETALLE DEL PEDIDO

header("Content-Type: application/json; charset=utf-8");

require_once "verificar_admin.php";
require_once "conexion.php";

// Recibir el numero del pedido
$idPedido = filter_input(
    INPUT_GET,
    "id",
    FILTER_VALIDATE_INT
);

// Comprobar el ID
if (!$idPedido || $idPedido < 1) {

    http_response_code(400);

    echo json_encode([
        "exito" => false,
        "mensaje" => "ID de pedido incorrecto"
    ]);

    exit;
}

try {

    // =====================================
    // 1. CONSULTAR PEDIDO Y REPARTIDOR
    // =====================================

    $sql = "SELECT

                p.id_pedido,
                p.cliente,
                p.telefono,
                p.direccion,
                p.codigo_postal,
                p.referencias,
                p.fecha_pedido,
                p.total,
                p.estatus_pedido,
                p.motivo_cancelacion,

                r.nombre AS nombre_repartidor,
                r.usuario AS usuario_repartidor,
                r.grupo AS grupo_repartidor,
                r.placa_vehiculo AS placa_repartidor,
                r.telefono AS telefono_repartidor

            FROM pedidos p

            LEFT JOIN repartidores r
                ON p.id_repartidor = r.id_repartidor

            WHERE p.id_pedido = ?";

    $consulta = $conexion->prepare($sql);

    $consulta->execute([$idPedido]);

    $pedido = $consulta->fetch(PDO::FETCH_ASSOC);

    // Comprobar que existe
    if (!$pedido) {

        http_response_code(404);

        echo json_encode([
            "exito" => false,
            "mensaje" => "Pedido no encontrado"
        ]);

        exit;
    }


    // =====================================
    // 2. CONSULTAR PRODUCTOS
    // =====================================

    $sqlProductos = "SELECT

                        p.nombre,
                        p.presentacion,
                        p.imagen,

                        d.cantidad,
                        d.precio_unitario,
                        d.subtotal

                    FROM detalles_pedidos d

                    INNER JOIN productos p
                        ON d.id_producto = p.id_producto

                    WHERE d.id_pedido = ?

                    ORDER BY d.id_producto";

    $consultaProductos = $conexion->prepare(
        $sqlProductos
    );

    $consultaProductos->execute([$idPedido]);

    $productos = $consultaProductos->fetchAll(
        PDO::FETCH_ASSOC
    );


    // =====================================
    // 3. ENVIAR DATOS A JAVASCRIPT
    // =====================================

    echo json_encode([
        "exito" => true,
        "pedido" => $pedido,
        "productos" => $productos
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al consultar el pedido"
    ], JSON_UNESCAPED_UNICODE);
}

?>
