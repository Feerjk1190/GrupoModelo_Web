<?php

header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/conexion.php";

try {

    $sql = "SELECT
                id_web AS id,
                nombre,
                presentacion,
                precio_unitario AS precio,
                stock_disponible AS stock,
                categoria,
                imagen,
                estatus,
                descuento_porcentaje
            FROM productos
            WHERE id_web IS NOT NULL
            ORDER BY id_web";

    $consulta = $conexion->query($sql);
    $productos = $consulta->fetchAll();

    // Convertir números al tipo correspondiente
    foreach ($productos as &$producto) {
        $producto["id"] = (int) $producto["id"];
        $producto["precio"] = (float) $producto["precio"];
        $producto["stock"] = (int) $producto["stock"];
        $producto["descuento_porcentaje"] =
            (float) $producto["descuento_porcentaje"];
    }
    unset($producto);

    echo json_encode([
        "exito" => true,
        "productos" => $productos
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No se pudieron consultar los productos."
    ]);
}
