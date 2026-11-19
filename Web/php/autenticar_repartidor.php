
<?php

// COMPROBAR SESIÓN DEL REPARTIDOR

require_once "conexion.php";

// Respuesta cuando la sesión no es válida
function errorAcceso($mensaje = "Sesión inválida o vencida") {

    http_response_code(401);

    echo json_encode([
        "status" => "error",
        "message" => $mensaje
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

// Recibir el token enviado por Android
$token = $_SERVER["HTTP_X_AUTH_TOKEN"] ?? "";

// Comprobar el formato
if (strlen($token) != 64 || !ctype_xdigit($token)) {
    errorAcceso();
}

// Proteger el token para buscarlo en MySQL
$hash = hash("sha256", $token);

// Buscar la sesión activa
$sql = "SELECT
            r.id_repartidor,
            r.nombre,
            r.usuario,
            r.grupo,
            r.placa_vehiculo,
            r.telefono
        FROM sesiones_repartidores s
        INNER JOIN repartidores r
            ON r.id_repartidor = s.id_repartidor
        WHERE s.token_hash = ?
        AND s.fecha_expiracion > NOW()
        AND r.activo = 1";

$consulta = $conexion->prepare($sql);
$consulta->execute([$hash]);

$repartidorActual = $consulta->fetch(PDO::FETCH_ASSOC);

// Comprobar que existe una sesión válida
if (!$repartidorActual) {
    errorAcceso();
}

// ID del repartidor que inició sesión
$idRepartidorActual = (int)$repartidorActual["id_repartidor"];

?>
