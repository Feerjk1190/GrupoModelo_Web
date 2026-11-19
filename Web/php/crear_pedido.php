
<?php

header("Content-Type: application/json; charset=utf-8");

// Enviar una respuesta al navegador
function responder($exito, $mensaje, $codigo = 200, $extra = []) {
    http_response_code($codigo);

    echo json_encode(
        array_merge([
            "exito" => $exito,
            "mensaje" => $mensaje
        ], $extra),
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

// Permitir solamente solicitudes POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    responder(false, "Método no permitido.", 405);
}

// Comprobar que el cliente inició sesión
session_start();

if (empty($_SESSION["id_usuario"])) {
    responder(false, "Debes iniciar sesión.", 401);
}

$idUsuario = (int) $_SESSION["id_usuario"];

// Recibir los datos enviados desde JavaScript
$datos = json_decode(
    file_get_contents("php://input"),
    true
);

if (!is_array($datos)) {
    responder(false, "Datos incorrectos.", 400);
}

// Identificar la compra para evitar pedidos duplicados
$claveSolicitud = $datos["clave_solicitud"] ?? "";

if (
    !is_string($claveSolicitud) ||
    !preg_match("/^[a-f0-9]{32}$/", $claveSolicitud)
) {
    responder(false, "La clave de la solicitud no es válida.", 400);
}

// Datos de entrega del cliente
$cliente = trim($datos["nombre"] ?? "");
$telefono = trim($datos["telefono"] ?? "");
$codigoPostal = trim($datos["codigo_postal"] ?? "");
$direccion = trim($datos["direccion"] ?? "");
$referencias = trim($datos["referencias"] ?? "");

$carrito = $datos["productos"] ?? null;

// Validar que los campos obligatorios estén completos
if (
    $cliente === "" ||
    $telefono === "" ||
    $codigoPostal === "" ||
    $direccion === ""
) {
    responder(false, "Completa los datos obligatorios.", 400);
}

if (
    strlen($cliente) > 100 ||
    strlen($direccion) > 150 ||
    strlen($referencias) > 200
) {
    responder(false, "Uno de los campos es demasiado largo.", 400);
}

if (!preg_match("/^[0-9]{10}$/", $telefono)) {
    responder(false, "El teléfono debe tener 10 dígitos.", 400);
}

if (!preg_match("/^[0-9]{5}$/", $codigoPostal)) {
    responder(false, "El código postal debe tener 5 dígitos.", 400);
}

// Comprobar si el arreglo del carrito está vacío
if (!is_array($carrito) || count($carrito) === 0) {
    responder(false, "El carrito está vacío.", 400);
}

if (count($carrito) > 32) {
    responder(false, "Demasiados productos.", 400);
}

// ARREGLOS: organizar las cantidades por producto
$cantidades = [];

foreach ($carrito as $item) {

    if (
        !is_array($item) ||
        !isset($item["id"], $item["cantidad"]) ||
        !is_int($item["id"]) ||
        !is_int($item["cantidad"]) ||
        $item["id"] < 1 ||
        $item["cantidad"] < 1 ||
        $item["cantidad"] > 10000
    ) {
        responder(
            false,
            "Hay productos o cantidades incorrectas.",
            400
        );
    }

    $idWeb = $item["id"];
    $cantidad = $item["cantidad"];

    if (!isset($cantidades[$idWeb])) {
        $cantidades[$idWeb] = 0;
    }

    $cantidades[$idWeb] += $cantidad;

    if ($cantidades[$idWeb] > 10000) {
        responder(false, "Cantidad no permitida.", 400);
    }
}

// Ordenar los IDs para revisar el inventario en orden fijo
ksort($cantidades, SORT_NUMERIC);

// Conectar con la base de datos
require_once __DIR__ . "/conexion.php";

// Buscar si esta misma compra ya fue registrada
function buscarPedidoExistente(
    $conexion,
    $claveSolicitud,
    $idUsuario
) {
    $consulta = $conexion->prepare("
        SELECT id_pedido, total, estatus_pedido
        FROM pedidos
        WHERE clave_solicitud = :clave
        AND id_usuario = :usuario
        LIMIT 1
    ");

    $consulta->execute([
        ":clave" => $claveSolicitud,
        ":usuario" => $idUsuario
    ]);

    return $consulta->fetch(PDO::FETCH_ASSOC);
}

// Devolver los datos de una compra que ya existe
function responderPedidoExistente($pedido) {
    responder(
        true,
        "Este pedido ya había sido registrado.",
        200,
        [
            "id_pedido" => (int) $pedido["id_pedido"],
            "total" => (float) $pedido["total"],
            "estatus" => $pedido["estatus_pedido"],
            "repetido" => true
        ]
    );
}

// RECURSIVIDAD: sumar en centavos el subtotal de cada producto.
// Caso base: terminamos el arreglo y regresamos cero.
// Paso recursivo: subtotal actual + total de los productos restantes.
function calcularTotalRecursivo($productos, $indice = 0) {
    if ($indice >= count($productos)) {
        return 0;
    }

    $actual = (int) round($productos[$indice]["subtotal"] * 100);
    return $actual + calcularTotalRecursivo($productos, $indice + 1);
}

try {

    // Evitar registrar dos veces la misma compra
    $pedidoAnterior = buscarPedidoExistente(
        $conexion,
        $claveSolicitud,
        $idUsuario
    );

    if ($pedidoAnterior) {
        responderPedidoExistente($pedidoAnterior);
    }

    // TRANSACCIÓN: todos los cambios se guardan juntos
    $conexion->beginTransaction();

    $productosPedido = [];
    $totalCentavos = 0;

    // Consultar precios, descuentos y existencias en MySQL
    $consultarProducto = $conexion->prepare("
        SELECT
            id_producto,
            nombre,
            precio_unitario,
            descuento_porcentaje,
            stock_disponible,
            estatus
        FROM productos
        WHERE id_web = :id_web
        FOR UPDATE
    ");

    // Recorrer uno por uno los productos del carrito
    foreach ($cantidades as $idWeb => $cantidad) {

        $consultarProducto->execute([
            ":id_web" => $idWeb
        ]);

        $encontrados = $consultarProducto->fetchAll(
            PDO::FETCH_ASSOC
        );

        if (count($encontrados) !== 1) {
            throw new RuntimeException(
                "No se encontró uno de los productos."
            );
        }

        $producto = $encontrados[0];

        $stock = (int) $producto["stock_disponible"];

        // Comprobar las existencias antes de comprar
        if (
            $producto["estatus"] === "Agotado" ||
            $stock < $cantidad
        ) {
            throw new RuntimeException(
                "No hay existencias suficientes de " .
                $producto["nombre"] . "."
            );
        }

        // Obtener el precio original desde MySQL
        $precioOriginal = (float) $producto["precio_unitario"];

        // Obtener el descuento establecido por el administrador
        $descuento = (float) $producto["descuento_porcentaje"];

        if ($precioOriginal <= 0) {
            throw new RuntimeException(
                "Uno de los precios es incorrecto."
            );
        }

        if ($descuento < 0 || $descuento > 100) {
            throw new RuntimeException(
                "Uno de los descuentos es incorrecto."
            );
        }

        // DESCUENTO: calcular el precio que pagará el cliente
        $precioCentavos = (int) round(
            $precioOriginal * (1 - $descuento / 100) * 100
        );

        // Calcular el subtotal según la cantidad comprada
        $subtotalCentavos = $precioCentavos * $cantidad;

        // Guardar los productos que formarán parte del pedido
        $productosPedido[] = [
            "id_producto" => (int) $producto["id_producto"],
            "cantidad" => $cantidad,
            "precio" => $precioCentavos / 100,
            "subtotal" => $subtotalCentavos / 100
        ];
    }

    // Sumar recursivamente los subtotales de los productos del pedido.
    $totalCentavos = calcularTotalRecursivo($productosPedido);
    $total = $totalCentavos / 100;

    if ($total > 99999999.99) {
        throw new RuntimeException(
            "El total del pedido supera el límite permitido."
        );
    }

    // Registrar el pedido principal
    $insertarPedido = $conexion->prepare("
        INSERT INTO pedidos (
            id_usuario,
            cliente,
            telefono,
            direccion,
            codigo_postal,
            referencias,
            fecha_pedido,
            total,
            estatus_pedido,
            clave_solicitud
        )
        VALUES (
            :id_usuario,
            :cliente,
            :telefono,
            :direccion,
            :codigo_postal,
            :referencias,
            NOW(),
            :total,
            'Pendiente',
            :clave_solicitud
        )
    ");

    $insertarPedido->execute([
        ":id_usuario" => $idUsuario,
        ":cliente" => $cliente,
        ":telefono" => $telefono,
        ":direccion" => $direccion,
        ":codigo_postal" => $codigoPostal,
        ":referencias" => $referencias !== ""
            ? $referencias
            : "Sin referencias",
        ":total" => $total,
        ":clave_solicitud" => $claveSolicitud
    ]);

    $idPedido = (int) $conexion->lastInsertId();

    // Preparar la consulta para guardar los detalles
    $insertarDetalle = $conexion->prepare("
        INSERT INTO detalles_pedidos (
            id_pedido,
            id_producto,
            cantidad,
            precio_unitario,
            subtotal
        )
        VALUES (
            :id_pedido,
            :id_producto,
            :cantidad,
            :precio,
            :subtotal
        )
    ");

    // Preparar la consulta para descontar existencias
    $actualizarInventario = $conexion->prepare("
        UPDATE productos
        SET
            stock_disponible = stock_disponible - :cantidad,
            salidas = salidas + :salidas
        WHERE id_producto = :id_producto
        AND stock_disponible >= :cantidad_verificar
    ");

    // Cambiar el estado a Agotado cuando el stock llegue a cero
    $actualizarEstado = $conexion->prepare("
        UPDATE productos
        SET estatus = 'Agotado'
        WHERE id_producto = :id_producto
        AND stock_disponible = 0
    ");

    // Recorrer los productos que se van a registrar
    foreach ($productosPedido as $producto) {

        // Guardar cantidad, precio rebajado y subtotal
        $insertarDetalle->execute([
            ":id_pedido" => $idPedido,
            ":id_producto" => $producto["id_producto"],
            ":cantidad" => $producto["cantidad"],
            ":precio" => $producto["precio"],
            ":subtotal" => $producto["subtotal"]
        ]);

        // Descontar existencias y aumentar las salidas
        $actualizarInventario->execute([
            ":cantidad" => $producto["cantidad"],
            ":salidas" => $producto["cantidad"],
            ":id_producto" => $producto["id_producto"],
            ":cantidad_verificar" => $producto["cantidad"]
        ]);

        if ($actualizarInventario->rowCount() !== 1) {
            throw new RuntimeException(
                "No se pudo actualizar el inventario."
            );
        }

        // Marcar agotado si ya no quedan unidades
        $actualizarEstado->execute([
            ":id_producto" => $producto["id_producto"]
        ]);
    }

    // Confirmar todos los cambios en MySQL
    $conexion->commit();

    responder(
        true,
        "Pedido registrado correctamente.",
        200,
        [
            "id_pedido" => $idPedido,
            "total" => $total,
            "estatus" => "Pendiente",
            "repetido" => false
        ]
    );

} catch (Throwable $error) {

    // Deshacer los cambios si ocurrió algún problema
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }

    // Verificar si la compra se registró en otra solicitud
    try {

        $pedidoAnterior = buscarPedidoExistente(
            $conexion,
            $claveSolicitud,
            $idUsuario
        );

        if ($pedidoAnterior) {
            responderPedidoExistente($pedidoAnterior);
        }

    } catch (Throwable $errorConsulta) {
        error_log($errorConsulta->getMessage());
    }

    if ($error instanceof PDOException) {
        error_log($error->getMessage());

        responder(
            false,
            "No se pudo registrar el pedido en MySQL.",
            500
        );
    }

    if ($error instanceof RuntimeException) {
        responder(false, $error->getMessage(), 400);
    }

    error_log($error->getMessage());

    responder(
        false,
        "Ocurrió un error al registrar el pedido.",
        500
    );
}
