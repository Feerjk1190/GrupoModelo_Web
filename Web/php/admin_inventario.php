
<?php

require_once __DIR__ . "/verificar_admin.php";
require_once __DIR__ . "/conexion.php";

try {

    // Consultar los productos registrados en el catálogo
    $sql = "SELECT
                id_producto,
                id_web,
                nombre,
                presentacion,
                categoria,
                imagen,
                precio_unitario,
                stock_disponible,
                entradas,
                salidas,
                estatus
            FROM productos
            WHERE id_web IS NOT NULL
            ORDER BY nombre";

    $consulta = $conexion->query($sql);

    // ARREGLOS: obtener todos los productos de MySQL
    $productos = $consulta->fetchAll(PDO::FETCH_ASSOC);

    $totalProductos = 0;
    $disponibles = 0;
    $bajoStock = 0;
    $agotados = 0;
    $totalEntradas = 0;
    $totalSalidas = 0;

    // Recorrer los productos para calcular las estadísticas
    foreach ($productos as &$producto) {

        $stock = (int) $producto["stock_disponible"];
        $entradas = (int) $producto["entradas"];
        $salidas = (int) $producto["salidas"];

        // CONDICIONALES: identificar el estado del inventario
        if ($stock <= 0) {
            $estado = "Agotado";
            $agotados++;

        } elseif ($stock <= 10) {
            $estado = "Bajo stock";
            $bajoStock++;

        } else {
            $estado = "Disponible";
            $disponibles++;
        }

        // Agregar el indicador calculado a cada producto
        $producto["estado_inventario"] = $estado;

        // Convertir los valores a números
        $producto["stock_disponible"] = $stock;
        $producto["entradas"] = $entradas;
        $producto["salidas"] = $salidas;
        $producto["precio_unitario"] =
            (float) $producto["precio_unitario"];

        // Acumular los resultados
        $totalProductos++;
        $totalEntradas += $entradas;
        $totalSalidas += $salidas;
    }

    unset($producto);

    // Enviar los productos y estadísticas a JavaScript
    echo json_encode([
        "exito" => true,
        "productos" => $productos,
        "resumen" => [
            "total_productos" => $totalProductos,
            "disponibles" => $disponibles,
            "bajo_stock" => $bajoStock,
            "agotados" => $agotados,
            "entradas" => $totalEntradas,
            "salidas" => $totalSalidas
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No se pudo consultar el inventario."
    ], JSON_UNESCAPED_UNICODE);
}
