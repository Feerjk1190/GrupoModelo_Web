
<?php

// ACTUALIZAR ESTADO DE LOS PEDIDOS

header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once "autenticar_repartidor.php";

// Función para responder a Android
function responder($estado, $mensaje, $codigo = 200) {

    http_response_code($codigo);

    echo json_encode([
        "status" => $estado,
        "message" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Solo aceptar POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    responder("error", "Usa POST", 405);
}

// Recibir los datos
$idPedido = (int)($_POST["id_pedido"] ?? 0);
$estadoNuevo = $_POST["estatus"] ?? "";

// Comprobar datos
if ($idPedido <= 0 ||
    !in_array($estadoNuevo, ["En Camino", "Entregado"], true)) {

    responder("error", "Datos incorrectos", 400);
}

try {

    // Iniciar operación
    $conexion->beginTransaction();

    // Buscar y bloquear el pedido
    $sql = "SELECT estatus_pedido, id_repartidor
            FROM pedidos
            WHERE id_pedido = ?
            FOR UPDATE";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([$idPedido]);

    $pedido = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$pedido) {

        $conexion->rollBack();
        responder("error", "Pedido no encontrado", 404);
    }

    $estadoActual = $pedido["estatus_pedido"];

    if ($estadoActual == "En camino") {
        $estadoActual = "En Camino";
    }

    // ACEPTAR PEDIDO
    if ($estadoNuevo == "En Camino" &&
        $estadoActual == "Pendiente" &&
        $pedido["id_repartidor"] === null) {

        $sql = "UPDATE pedidos
                SET estatus_pedido = 'En Camino',
                    id_repartidor = ?
                WHERE id_pedido = ?";

        $valores = [
            $idRepartidorActual,
            $idPedido
        ];

    // ENTREGAR PEDIDO
    } elseif (
        $estadoNuevo == "Entregado" &&
        $estadoActual == "En Camino" &&
        (int)$pedido["id_repartidor"] == $idRepartidorActual
    ) {

        $sql = "UPDATE pedidos
                SET estatus_pedido = 'Entregado'
                WHERE id_pedido = ?";

        $valores = [$idPedido];

    } else {

        $conexion->rollBack();

        responder(
            "error",
            "Pedido ocupado o estado no permitido",
            409
        );
    }

    // Actualizar pedido
    $actualizar = $conexion->prepare($sql);
    $actualizar->execute($valores);

    $conexion->commit();

    responder("success", "Estado actualizado");

} catch (Throwable $error) {

    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    error_log($error->getMessage());

    responder("error", "Error al actualizar pedido", 500);
}

?>
