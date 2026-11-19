<?php


require_once __DIR__ . "/verificar_admin.php";

// Conectar con MySQL
require_once __DIR__ . "/conexion.php";

// Aceptar solamente consultas GET
if ($_SERVER["REQUEST_METHOD"] !== "GET") {

    http_response_code(405);

    echo json_encode([
        "exito" => false,
        "mensaje" => "Método no permitido."
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

try {

    // Consultar únicamente las cuentas de clientes
    $sql = "SELECT
                id_usuario,
                nombre_completo,
                correo,
                rol
            FROM usuarios
            WHERE rol = 'Cliente'
            ORDER BY nombre_completo";

    // Ejecutar la consulta
    $consulta = $conexion->query($sql);

    // ARREGLOS: guardar los clientes encontrados
    $clientes = $consulta->fetchAll(PDO::FETCH_ASSOC);

    // Contar los clientes registrados
    $totalClientes = count($clientes);

    // Enviar la información a JavaScript
    echo json_encode([
        "exito" => true,

        "clientes" => $clientes,

        "resumen" => [
            "total_clientes" => $totalClientes
        ]

    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $error) {

    // Registrar el error en el servidor
    error_log($error->getMessage());

    http_response_code(500);

    echo json_encode([
        "exito" => false,
        "mensaje" => "No se pudieron consultar los clientes."
    ], JSON_UNESCAPED_UNICODE);
}
