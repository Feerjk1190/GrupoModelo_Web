
<?php

require_once __DIR__ . "/verificar_admin.php";
require_once __DIR__ . "/conexion.php";

try {

    if ($_SERVER["REQUEST_METHOD"] === "GET") {

        $sql = "SELECT
                    id_producto,
                    nombre,
                    precio_unitario,
                    descuento_porcentaje,
                    stock_disponible
                FROM productos
                WHERE id_web IS NOT NULL
                ORDER BY nombre";

        $consulta = $conexion->query($sql);
        $productos = $consulta->fetchAll();

        echo json_encode([
            "exito" => true,
            "productos" => $productos
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {

        $datos = json_decode(file_get_contents("php://input"), true);

        if (!is_array($datos)) {
            http_response_code(400);

            echo json_encode([
                "exito" => false,
                "mensaje" => "Datos incorrectos."
            ]);

            exit;
        }

        $id = filter_var(
            $datos["id_producto"] ?? null,
            FILTER_VALIDATE_INT
        );

        $descuento = $datos["descuento_porcentaje"] ?? null;

        if (
            $id === false ||
            $id === null ||
            $id <= 0 ||
            !is_numeric($descuento) ||
            $descuento < 0 ||
            $descuento > 100
        ) {
            http_response_code(400);

            echo json_encode([
                "exito" => false,
                "mensaje" => "Revisa el producto y el descuento."
            ]);

            exit;
        }

        $consulta = $conexion->prepare(
            "SELECT id_producto
             FROM productos
             WHERE id_producto = ?
             AND id_web IS NOT NULL"
        );

        $consulta->execute([$id]);

        if (!$consulta->fetch()) {
            http_response_code(404);

            echo json_encode([
                "exito" => false,
                "mensaje" => "No se encontró el producto."
            ]);

            exit;
        }

        $consulta = $conexion->prepare(
            "UPDATE productos
             SET descuento_porcentaje = ?
             WHERE id_producto = ?"
        );

        $consulta->execute([
            $descuento,
            $id
        ]);

        echo json_encode([
            "exito" => true,
            "mensaje" => "Descuento actualizado correctamente."
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    http_response_code(405);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Método no permitido."
    ]);

} catch (PDOException $error) {

    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Ocurrió un error al consultar los descuentos."
    ], JSON_UNESCAPED_UNICODE);
}
