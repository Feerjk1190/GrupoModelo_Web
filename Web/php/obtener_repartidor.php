<?php
header("Content-Type: application/json; charset=utf-8");
header("Cache-Control: no-store");

require_once "conexion.php";

// ID fijo únicamente para la etapa de pruebas sin login.
$idRepartidor = (int) ($_GET["id_repartidor"] ?? 0);

if ($idRepartidor <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID incorrecto"]);
    exit;
}

try {
    // Nunca enviar contraseñas ni hashes al celular.
    $sql = "SELECT id_repartidor, nombre, usuario, grupo,
                   placa_vehiculo, telefono
            FROM repartidores
            WHERE id_repartidor = ? AND activo = 1";

    $consulta = $conexion->prepare($sql);
    $consulta->execute([$idRepartidor]);
    $repartidor = $consulta->fetch(PDO::FETCH_ASSOC);

    if ($repartidor) {
        echo json_encode([
            "status" => "success",
            "repartidor" => $repartidor
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Repartidor no encontrado"
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (PDOException $error) {
    error_log($error->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Error de consulta"]);
}
