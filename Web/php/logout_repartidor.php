
<?php

// CERRAR SESIÓN DEL REPARTIDOR

header("Content-Type: application/json; charset=utf-8");

require_once "autenticar_repartidor.php";

if ($_SERVER["REQUEST_METHOD"] != "POST") {

    http_response_code(405);

    echo json_encode([
        "status" => "error",
        "message" => "Usa POST"
    ]);

    exit;
}

// Eliminar el token de la base de datos
$sql = "DELETE FROM sesiones_repartidores
        WHERE token_hash = ?";

$consulta = $conexion->prepare($sql);

$consulta->execute([
    hash("sha256", $token)
]);

echo json_encode([
    "status" => "success"
]);

?>
