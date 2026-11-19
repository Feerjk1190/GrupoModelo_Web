<?php

header("Content-Type: application/json; charset=utf-8");

session_start();

function responder($exito, $mensaje, $pedidos = [], $codigo = 200) {
    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje,
        "pedidos" => $pedidos
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Aceptar solamente GET
if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    header("Allow: GET");
    responder(false, "Método no permitido.", [], 405);
}

// Verificar que el usuario inició sesión
if (empty($_SESSION["id_usuario"])) {
    responder(false, "Debes iniciar sesión.", [], 401);
}

$idUsuario = (int) $_SESSION["id_usuario"];

require_once __DIR__ . "/conexion.php";

try {

    // CONSULTAR PEDIDOS DEL CLIENTE
    $consultaPedidos = $conexion->prepare("
        SELECT
            id_pedido,
            cliente,
            fecha_pedido,
            total,
            estatus_pedido
        FROM pedidos
        WHERE id_usuario = :id_usuario
        ORDER BY fecha_pedido DESC, id_pedido DESC
    ");

    $consultaPedidos->execute([
        ":id_usuario" => $idUsuario
    ]);

    $pedidos = $consultaPedidos->fetchAll(PDO::FETCH_ASSOC);

    // CONSULTAR DETALLES DE LOS PEDIDOS
    $consultaDetalles = $conexion->prepare("
        SELECT
            dp.id_pedido,
            dp.id_producto,
            dp.cantidad,
            dp.precio_unitario,
            dp.subtotal,
            p.nombre,
            p.presentacion,
            p.imagen
        FROM detalles_pedidos dp
        INNER JOIN pedidos pe
            ON pe.id_pedido = dp.id_pedido
        INNER JOIN productos p
            ON p.id_producto = dp.id_producto
        WHERE pe.id_usuario = :id_usuario
        ORDER BY dp.id_pedido DESC, dp.id_detalle ASC
    ");

    $consultaDetalles->execute([
        ":id_usuario" => $idUsuario
    ]);

    $detalles = $consultaDetalles->fetchAll(PDO::FETCH_ASSOC);

    // AGRUPAR LOS PRODUCTOS POR PEDIDO
    $productosPorPedido = [];

    foreach ($detalles as $detalle) {

        $idPedido = (int) $detalle["id_pedido"];

        if (!isset($productosPorPedido[$idPedido])) {
            $productosPorPedido[$idPedido] = [];
        }

        $productosPorPedido[$idPedido][] = [
            "id_producto" => (int) $detalle["id_producto"],
            "nombre" => $detalle["nombre"],
            "presentacion" => $detalle["presentacion"],
            "imagen" => $detalle["imagen"],
            "cantidad" => (int) $detalle["cantidad"],
            "precio_unitario" => (float) $detalle["precio_unitario"],
            "subtotal" => (float) $detalle["subtotal"]
        ];
    }

    // PREPARAR EL RESULTADO FINAL
    $resultado = [];

    foreach ($pedidos as $pedido) {

        $idPedido = (int) $pedido["id_pedido"];

        $resultado[] = [
            "id_pedido" => $idPedido,
            "cliente" => $pedido["cliente"],
            "fecha_pedido" => $pedido["fecha_pedido"],
            "total" => (float) $pedido["total"],
            "estatus" => $pedido["estatus_pedido"],
            "productos" => $productosPorPedido[$idPedido] ?? []
        ];
    }

    responder(
        true,
        "Historial de compras consultado correctamente.",
        $resultado
    );

} catch (Throwable $error) {

    error_log($error->getMessage());

    responder(
        false,
        "No se pudo consultar el historial de compras.",
        [],
        500
    );
}
