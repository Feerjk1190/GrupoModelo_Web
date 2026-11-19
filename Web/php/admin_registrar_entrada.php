
<?php

require_once __DIR__ . "/verificar_admin.php";
require_once __DIR__ . "/conexion.php";

// Enviar una respuesta al navegador
function responder($exito, $mensaje, $codigo = 200) {

    http_response_code($codigo);

    echo json_encode([
        "exito" => $exito,
        "mensaje" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Permitir solamente solicitudes POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "Método no permitido.", 405);
}

// Obtener los datos enviados desde JavaScript
$datos = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($datos)) {
    responder(false, "Datos incorrectos.", 400);
}

$idProducto = filter_var(
    $datos["id_producto"] ?? null,
    FILTER_VALIDATE_INT
);

$cantidad = filter_var(
    $datos["cantidad"] ?? null,
    FILTER_VALIDATE_INT
);

// Validar el producto y la cantidad
if (
    !$idProducto ||
    !$cantidad ||
    $idProducto < 1 ||
    $cantidad < 1 ||
    $cantidad > 10000
) {
    responder(
        false,
        "Selecciona un producto y una cantidad válida.",
        400
    );
}

try {

    // TRANSACCIÓN: guardar el movimiento de forma segura
    $conexion->beginTransaction();

    // Consultar el producto y bloquearlo durante la operación
    $consulta = $conexion->prepare(
        "SELECT
            id_producto,
            nombre,
            stock_disponible,
            entradas
         FROM productos
         WHERE id_producto = ?
         AND id_web IS NOT NULL
         FOR UPDATE"
    );

    $consulta->execute([$idProducto]);

    $producto = $consulta->fetch(PDO::FETCH_ASSOC);

    // Comprobar que el producto exista
    if (!$producto) {
        $conexion->rollBack();

        responder(false, "No se encontró el producto.", 404);
    }

    // Calcular las nuevas existencias
    $stockAnterior = (int) $producto["stock_disponible"];
    $entradasAnteriores = (int) $producto["entradas"];

    $stockNuevo = $stockAnterior + $cantidad;
    $entradasNuevas = $entradasAnteriores + $cantidad;

    // Actualizar existencias y entradas en MySQL
    $actualizar = $conexion->prepare(
        "UPDATE productos
         SET
            stock_disponible = ?,
            entradas = ?,
            estatus = CASE
                WHEN estatus = 'Agotado'
                THEN 'Disponible'
                ELSE estatus
            END
         WHERE id_producto = ?"
    );

    $actualizar->execute([
        $stockNuevo,
        $entradasNuevas,
        $idProducto
    ]);

    // Confirmar el movimiento
    $conexion->commit();

    responder(
        true,
        "Entrada registrada correctamente."
    );

} catch (PDOException $error) {

    // Deshacer la operación si ocurre un error
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    error_log($error->getMessage());

    responder(
        false,
        "No se pudo registrar la entrada.",
        500
    );
}
