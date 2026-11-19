
<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/verificar_admin.php";
require_once __DIR__ . "/conexion.php";

// Función para responder a JavaScript
function responder($exito, $mensaje, $codigo = 200) {

    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Solamente permitir POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "Método no permitido", 405);
}

// Recibir información
$datos = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($datos)) {
    responder(false, "Datos incorrectos", 400);
}

$idPedido = filter_var(
    $datos["id_pedido"] ?? null,
    FILTER_VALIDATE_INT
);

$estado = $datos["estatus_pedido"] ?? "";
$motivo = trim($datos["motivo_cancelacion"] ?? "");

// Comprobar datos
if (!$idPedido || $idPedido < 1) {
    responder(false, "ID incorrecto", 400);
}

// Solo permitir cancelaciones desde el administrador
if ($estado !== "Cancelado") {
    responder(false, "Estado no permitido", 400);
}

if ($motivo === "" || mb_strlen($motivo) > 255) {
    responder(false, "Escribe un motivo válido (máximo 255 caracteres)", 400);
}

try {

    // Iniciar transacción
    $conexion->beginTransaction();

    // Bloquear el pedido para evitar cambios simultáneos
    $consulta = $conexion->prepare(
        "SELECT estatus_pedido
         FROM pedidos
         WHERE id_pedido = ?
         FOR UPDATE"
    );

    $consulta->execute([$idPedido]);
    $pedido = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$pedido) {
        $conexion->rollBack();
        responder(false, "Pedido no encontrado", 404);
    }

    // Solo cancelar pedidos pendientes
    if ($pedido["estatus_pedido"] !== "Pendiente") {
        $conexion->rollBack();
        responder(
            false,
            "Solo puedes cancelar pedidos pendientes",
            400
        );
    }

    // Obtener productos del pedido
    $consultaDetalles = $conexion->prepare(
        "SELECT id_producto, cantidad
         FROM detalles_pedidos
         WHERE id_pedido = ?"
    );

    $consultaDetalles->execute([$idPedido]);

    $productos = $consultaDetalles->fetchAll(
        PDO::FETCH_ASSOC
    );

    if (count($productos) === 0) {
        throw new RuntimeException(
            "El pedido no tiene productos registrados"
        );
    }

    // Devolver unidades al inventario
    $devolver = $conexion->prepare(
        "UPDATE productos
         SET stock_disponible = stock_disponible + :cantidad,
             salidas = GREATEST(0, salidas - :salidas),
             estatus = CASE
                 WHEN estatus = 'Agotado'
                 THEN 'Disponible'
                 ELSE estatus
             END
         WHERE id_producto = :producto"
    );

    foreach ($productos as $producto) {

        $cantidad = (int) $producto["cantidad"];

        if ($cantidad < 1) {
            throw new RuntimeException(
                "Cantidad incorrecta en el pedido"
            );
        }

        $devolver->execute([
            ":cantidad" => $cantidad,
            ":salidas" => $cantidad,
            ":producto" => $producto["id_producto"]
        ]);

        if ($devolver->rowCount() !== 1) {
            throw new RuntimeException(
                "No se pudo devolver un producto"
            );
        }
    }

    // Guardar estado y motivo
    $actualizar = $conexion->prepare(
        "UPDATE pedidos
         SET estatus_pedido = 'Cancelado',
             motivo_cancelacion = ?
         WHERE id_pedido = ?"
    );

    $actualizar->execute([
        $motivo,
        $idPedido
    ]);

    // Confirmar todos los cambios
    $conexion->commit();

    responder(true, "Pedido cancelado correctamente");

} catch (Throwable $error) {

    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    error_log($error->getMessage());

    responder(
        false,
        "No se pudo cancelar el pedido",
        500
    );
}

?>
